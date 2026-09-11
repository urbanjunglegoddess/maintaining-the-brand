import type { Book, Part, Section } from "./types";

/**
 * The free sample.
 *
 * Everything outside this list is paid content. Change the list to change what
 * a visitor can read before buying — it's the one place that decision lives.
 *
 * Chosen so the sample is genuinely useful on its own (a reader can finish
 * their Brand Story and Mission) and shows the Teach → Example → Your Turn
 * shape the rest of the book repeats.
 */
export const FREE_SECTIONS = ["1.1", "1.2", "1.3"] as const;

const FREE = new Set<string>(FREE_SECTIONS);

export function isFree(sectionNum: string): boolean {
  return FREE.has(sectionNum);
}

/**
 * A section with its teaching, example, and fields stripped out — only enough
 * left to render a title and a lock. This is what the paid sections become for
 * a viewer without an entitlement.
 */
export type MaybeLockedSection = Section & { locked?: boolean };
export type ViewerBook = { parts: (Omit<Part, "sections"> & { sections: MaybeLockedSection[] })[] };

function lock(s: Section): MaybeLockedSection {
  return {
    num: s.num,
    title: s.title,
    tag: "",
    desc: "",
    exWho: "",
    ex: "",
    intro: "",
    fields: [],
    locked: true,
  };
}

/**
 * Build the copy of the book this viewer is allowed to have.
 *
 * Called on the server. When `full` is false the paid content is genuinely
 * removed from the payload — not hidden with CSS — so it never ships to a
 * browser that hasn't paid for it.
 */
export function bookForViewer(book: Book, full: boolean): ViewerBook {
  if (full) return book as ViewerBook;
  return {
    parts: book.parts.map((p) => ({
      ...p,
      sections: p.sections.map((s) => (isFree(s.num) ? s : lock(s))),
    })),
  };
}

/** Total field count of the real book — so a locked viewer still sees honest totals. */
export function countFields(book: Book): number {
  return book.parts.reduce(
    (n, p) => n + p.sections.reduce((m, s) => m + s.fields.length, 0),
    0
  );
}
