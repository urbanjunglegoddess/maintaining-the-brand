import type { Book } from "./types";
import type { ViewerBook } from "./preview";

/**
 * Flatten parts → sections for linear navigation.
 *
 * This lives apart from lib/content.ts on purpose. Client components need this
 * helper, and lib/content.ts imports the whole book JSON at module scope —
 * importing it from the client would risk bundling every paid section into the
 * browser payload. Keep this file free of content imports.
 */
export function flattenSections(book: Book | ViewerBook) {
  return book.parts.flatMap((p) =>
    p.sections.map((s) => ({ ...s, partNum: p.num, partName: p.name }))
  );
}
