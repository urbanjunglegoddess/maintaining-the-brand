import type { Book } from "./types";
import raw from "@/content/book_data.json";

// Phase 0: content ships with the app from the seeded JSON.
// Phase 1+: swap this for a query against the `book_content` table (latest published version).
export function getBook(): Book {
  return raw as unknown as Book;
}

export function flattenSections(book: Book) {
  return book.parts.flatMap((p) =>
    p.sections.map((s) => ({ ...s, partNum: p.num, partName: p.name }))
  );
}
