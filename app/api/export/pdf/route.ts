import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getBook } from "@/lib/content";
import { getViewer } from "@/lib/auth";
import { hasFullAccess } from "@/lib/entitlement";
import { bookForViewer } from "@/lib/preview";
import { registerFonts } from "@/lib/pdf-fonts";
import { WorkbookPdf } from "@/components/pdf/WorkbookPdf";
import { supabaseServer } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";

/**
 * Renders the reader's filled workbook to a real PDF download.
 *
 * Works in both modes. In local mode the browser posts its answers up (they
 * only exist there); when signed in, they're read from the account instead,
 * so the export matches what's actually saved.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Answers = Record<string, Record<number, unknown>>;

export async function POST(req: Request) {
  const viewer = await getViewer();
  const full = await hasFullAccess(viewer);

  let body: { answers?: Answers; owner?: string; filledOnly?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* an empty body is fine — signed-in readers don't need to send anything */
  }

  let answers: Answers = body.answers && typeof body.answers === "object" ? body.answers : {};

  // Signed in: the account is the source of truth.
  if (viewer) {
    const sb = await supabaseServer();
    if (sb) {
      const { data } = await sb
        .from("answers")
        .select("section, field_idx, value")
        .eq("user_id", viewer.id);
      if (data?.length) {
        const out: Answers = {};
        for (const r of data) (out[r.section] ||= {})[r.field_idx] = r.value;
        answers = out;
      }
    }
  }

  const book = await getBook();
  // Never export what the reader hasn't unlocked.
  const allowed = bookForViewer(book, full) as Book;

  try {
    const fonts = registerFonts();
    // react-pdf types renderToBuffer against DocumentProps; our component
    // returns a <Document>, which the prop types can't see through.
    const doc = React.createElement(WorkbookPdf, {
      book: allowed,
      answers,
      fonts,
      owner: body.owner?.trim() || viewer?.email || null,
      filledOnly: body.filledOnly !== false,
    }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buf = await renderToBuffer(doc);

    const name = full ? "My-Brand-Book.pdf" : "My-Brand-Book-sample.pdf";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${name}"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export] pdf render failed", err);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }
}
