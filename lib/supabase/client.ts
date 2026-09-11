"use client";
import { createBrowserClient } from "@supabase/ssr";
import { authEnabled, supabase as cfg } from "@/lib/config";

/**
 * Browser Supabase client, for the auth UI.
 * Returns null when Supabase isn't configured — callers render local mode instead.
 */
export function supabaseBrowser() {
  if (!authEnabled) return null;
  return createBrowserClient(cfg.url!, cfg.anonKey!);
}
