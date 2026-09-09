import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maintaining the Brand",
  description:
    "An interactive brand workbook — build your whole brand identity, one guided section at a time.",
};

// Fraunces + Inter via Google Fonts. (Swap to next/font in Phase 1 if you prefer self-hosting.)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
