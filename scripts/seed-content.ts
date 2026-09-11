/**
 * Publish content/book_data.json into the book_content table as a new version.
 *
 *   npm run seed
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (they're read from .env.local automatically).
 *
 * Versions are append-only: the previous published row is unpublished rather
 * than deleted, so a bad edit can be rolled back by flipping `published`.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import rawBook from "../content/book_data.json";

// The JSON's inferred literal type is unwieldy; the shape we need here is small.
type SeedBook = { parts: { sections: { fields: unknown[] }[] }[] };
const book = rawBook as unknown as SeedBook;

function loadEnvLocal() {
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — rely on the ambient environment */
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const parts = book.parts.length;
  const sections = book.parts.reduce((n, p) => n + p.sections.length, 0);
  const fields = book.parts.reduce(
    (n, p) => n + p.sections.reduce((m, s) => m + s.fields.length, 0),
    0
  );
  console.log(`Loaded workbook: ${parts} parts, ${sections} sections, ${fields} fields.`);

  if (!url || !key) {
    console.log(
      "\nSupabase isn't configured, so there's nothing to seed.\n" +
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, then run this again.\n" +
        "Until then the app serves this same JSON straight from the bundle."
    );
    return;
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: latest, error: readErr } = await sb
    .from("book_content")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readErr) throw readErr;
  const version = (latest?.version ?? 0) + 1;

  const { error: insErr } = await sb
    .from("book_content")
    .insert({ version, data: book, published: false });
  if (insErr) throw insErr;

  // Flip over only once the new row is safely in.
  const { error: offErr } = await sb
    .from("book_content")
    .update({ published: false })
    .eq("published", true);
  if (offErr) throw offErr;

  const { error: onErr } = await sb
    .from("book_content")
    .update({ published: true })
    .eq("version", version);
  if (onErr) throw onErr;

  console.log(`Published book_content v${version}.`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
