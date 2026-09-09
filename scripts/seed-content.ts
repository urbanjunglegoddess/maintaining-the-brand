// PHASE 1 — seed / re-seed the workbook content into book_content.
// Reads content/book_data.json (produced by the parser) and inserts a new published version.
//
//   npx tsx scripts/seed-content.ts
//
// import { createClient } from "@supabase/supabase-js";
import book from "../content/book_data.json";

async function main() {
  const parts = (book as { parts: unknown[] }).parts.length;
  console.log(`Loaded workbook: ${parts} parts.`);
  // const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  // const { data: latest } = await sb.from("book_content").select("version").order("version",{ascending:false}).limit(1).single();
  // const version = (latest?.version ?? 0) + 1;
  // await sb.from("book_content").update({ published: false }).eq("published", true);
  // await sb.from("book_content").insert({ version, data: book, published: true });
  // console.log(`Seeded book_content v${version} (published).`);
  console.log("Phase 1: uncomment the Supabase calls once env vars are set.");
}
main();
