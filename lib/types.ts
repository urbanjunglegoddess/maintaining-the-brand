// Shared content shape — the single source of truth for parts → sections → fields.
// Mirrors the output of scripts/parse_book (book_data.json).

export type FieldType =
  | "text"
  | "textarea"
  | "imagenote"
  | "colorcard"
  | "check"
  | "logtable";

export interface Field {
  type: FieldType;
  label: string;
  hint?: string;
  sub?: string[]; // colorcard sub-labels, e.g. ["Name","HEX","RGB","CMYK"]
}

export interface Section {
  num: string; // "5.1"
  title: string;
  tag: string;
  desc: string; // sanitized inline HTML
  exWho: string;
  ex: string; // sanitized inline HTML
  intro: string;
  fields: Field[];
}

export interface Part {
  num: number;
  name: string;
  blurb: string;
  sections: Section[];
}

export interface Book {
  parts: Part[];
}

// Answer value shapes, by field type.
export type ColorCardValue = Record<string, string>;
export type LogRow = { date: string; what: string };
export type AnswerValue = string | boolean | ColorCardValue | LogRow[] | undefined;
