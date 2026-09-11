import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/config";

/**
 * Where Supabase sends the reader back after a magic link or an OAuth sign-in.
 * Exchanges the one-time code for a session cookie, then forwards them on.
 *
 * Add this exact URL to Supabase → Authentication → URL Configuration →
 * Redirect URLs:  {siteUrl}/auth/callback
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/workbook";
  // Only ever redirect within this app.
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/workbook";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", siteUrl));
  }

  const sb = await supabaseServer();
  if (!sb) return NextResponse.redirect(new URL("/", siteUrl));

  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", siteUrl));
  }

  // `welcome=1` tells the workbook to offer to bring across any answers
  // saved in this browser before the reader had an account.
  return NextResponse.redirect(new URL(`${dest}${dest.includes("?") ? "&" : "?"}signedin=1`, siteUrl));
}
