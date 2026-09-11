import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST() {
  const sb = await supabaseServer();
  if (sb) await sb.auth.signOut();
  return NextResponse.redirect(new URL("/", siteUrl), { status: 303 });
}
