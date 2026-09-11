import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * Brand fonts for the PDF export.
 *
 * react-pdf can't read woff2, so the export ships on its built-in Times/
 * Helvetica until real font files are present. To switch to the book's actual
 * typefaces, drop these TTFs into public/fonts/ and redeploy — no code change:
 *
 *   public/fonts/Fraunces-Regular.ttf
 *   public/fonts/Fraunces-SemiBold.ttf
 *   public/fonts/Inter-Regular.ttf
 *   public/fonts/Inter-SemiBold.ttf
 *   public/fonts/Inter-Italic.ttf        (optional)
 *
 * Both are free: Fraunces and Inter are SIL Open Font License, so they can be
 * embedded in a product you sell. Download the static TTFs from Google Fonts.
 */

export type FontSet = { display: string; body: string; embedded: boolean };

const DIR = path.join(process.cwd(), "public", "fonts");

function file(name: string): string | null {
  try {
    const p = path.join(DIR, name);
    return fs.existsSync(p) ? p : null;
  } catch {
    return null;
  }
}

let resolved: FontSet | null = null;

export function registerFonts(): FontSet {
  if (resolved) return resolved;

  const fr = file("Fraunces-Regular.ttf");
  const frSemi = file("Fraunces-SemiBold.ttf");
  const inter = file("Inter-Regular.ttf");
  const interSemi = file("Inter-SemiBold.ttf");
  const interItalic = file("Inter-Italic.ttf");

  // Both families must be present, or the page would mix embedded and
  // fallback metrics and look worse than the honest fallback.
  if (fr && inter) {
    try {
      Font.register({
        family: "Fraunces",
        fonts: [
          { src: fr, fontWeight: 400 },
          ...(frSemi ? [{ src: frSemi, fontWeight: 600 }] : []),
        ],
      });
      Font.register({
        family: "Inter",
        fonts: [
          { src: inter, fontWeight: 400 },
          ...(interSemi ? [{ src: interSemi, fontWeight: 600 }] : []),
          ...(interItalic ? [{ src: interItalic, fontStyle: "italic" as const }] : []),
        ],
      });
      resolved = { display: "Fraunces", body: "Inter", embedded: true };
      return resolved;
    } catch {
      // fall through to built-ins
    }
  }

  resolved = { display: "Times-Roman", body: "Helvetica", embedded: false };
  return resolved;
}

/** Don't hyphenate — the book's ragged-right setting reads better. */
Font.registerHyphenationCallback((word) => [word]);
