import type { Book } from "./types";
import raw from "@/content/book_data.json";
import { authEnabled } from "./config";

/** The workbook as it ships in the bundle. Always available, no network. */
export function bundledBook(): Book {
  return raw as unknown as Book;
}

/**
 * The workbook to render.
 *
 * Prefers the published row in `book_content` so the copy can be revised
 * without a redeploy (run `npm run seed` to publish a new version). Falls back
 * to the bundled JSON whenever Supabase is absent, empty, or unreachable —
 * the book is the product, so it must never fail to load.
 */
export async function getBook(): Promise<Book> {
  if (!authEnabled) return bundledBook();
  try {
    const { supabaseServer } = await import("./supabase/server");
    const sb = await supabaseServer();
    if (!sb) return bundledBook();
    const { data, error } = await sb
      .from("book_content")
      .select("data")
      .eq("published", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data?.data) return bundledBook();
    return data.data as Book;
  } catch {
    return bundledBook();
  }
}

