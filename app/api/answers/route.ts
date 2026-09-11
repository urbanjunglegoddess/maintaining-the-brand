import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { authEnabled } from "@/lib/config";

/**
 * Per-user answer sync. Only reachable when Supabase is configured — in local
 * mode the client never calls this, it writes to localStorage instead.
 *
 * Ownership is enforced twice: the user_id filter here, and the RLS policy on
 * the table. The policy is the one that actually matters.
 */

export const dynamic = "force-dynamic";

const MAX_BATCH = 200;

async function requireUser() {
  if (!authEnabled) return { error: NextResponse.json({ error: "auth_disabled" }, { status: 503 }) };
  const sb = await supabaseServer();
  if (!sb) return { error: NextResponse.json({ error: "auth_disabled" }, { status: 503 }) };
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  return { sb, user };
}

export async function GET() {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const { sb, user } = ctx;

  const { data, error } = await sb
    .from("answers")
    .select("section, field_idx, value")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "read_failed" }, { status: 500 });

  // Reshape into the store's { section: { idx: value } } form.
  const out: Record<string, Record<number, unknown>> = {};
  for (const row of data ?? []) {
    (out[row.section] ||= {})[row.field_idx] = row.value;
  }
  return NextResponse.json(out);
}

export async function PUT(req: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const { sb, user } = ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const incoming = (body as { answers?: unknown }).answers;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: "no_answers" }, { status: 400 });
  }
  if (incoming.length > MAX_BATCH) {
    return NextResponse.json({ error: "batch_too_large" }, { status: 413 });
  }

  const rows = [];
  for (const a of incoming) {
    const { section, field_idx, value } = (a ?? {}) as {
      section?: unknown;
      field_idx?: unknown;
      value?: unknown;
    };
    if (typeof section !== "string" || !/^\d{1,2}\.\d{1,2}$/.test(section)) {
      return NextResponse.json({ error: "bad_section" }, { status: 400 });
    }
    if (typeof field_idx !== "number" || !Number.isInteger(field_idx) || field_idx < 0 || field_idx > 999) {
      return NextResponse.json({ error: "bad_field_idx" }, { status: 400 });
    }
    rows.push({
      user_id: user.id,
      section,
      field_idx,
      value: value ?? null,
      updated_at: new Date().toISOString(),
    });
  }

  const { error } = await sb.from("answers").upsert(rows, { onConflict: "user_id,section,field_idx" });
  if (error) return NextResponse.json({ error: "write_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, saved: rows.length });
}

/** Clear every answer for this user. Used by the "start over" control. */
export async function DELETE() {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const { sb, user } = ctx;

  const { error } = await sb.from("answers").delete().eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
