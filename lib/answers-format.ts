import type { AnswerValue, Field, LogRow, ColorCardValue } from "./types";

/** Strip the inline HTML the parser leaves in desc/ex down to plain text. */
export function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isFilled(f: Field, v: AnswerValue): boolean {
  if (v === undefined || v === null) return false;
  if (f.type === "check") return v === true;
  if (f.type === "colorcard")
    return typeof v === "object" && Object.values(v as object).some((x) => x && String(x).trim());
  if (f.type === "logtable")
    return Array.isArray(v) && (v as LogRow[]).some((r) => (r.date || "").trim() || (r.what || "").trim());
  return String(v).trim().length > 0;
}

/** One-line-per-entry rendering of an answer, for the PDF and the clipboard. */
export function answerToText(f: Field, v: AnswerValue): string {
  if (!isFilled(f, v)) return "";
  if (f.type === "check") return "Yes";
  if (f.type === "colorcard") {
    const o = v as ColorCardValue;
    return (f.sub || Object.keys(o))
      .map((k) => (o[k] ? `${k}: ${o[k]}` : null))
      .filter(Boolean)
      .join("   ");
  }
  if (f.type === "logtable") {
    return (v as LogRow[])
      .filter((r) => (r.date || "").trim() || (r.what || "").trim())
      .map((r) => `${r.date || "—"} — ${r.what || ""}`.trim())
      .join("\n");
  }
  return String(v).trim();
}
