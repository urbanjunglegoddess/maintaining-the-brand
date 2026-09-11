import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { adminEnabled, authEnabled, supabase as cfg } from "@/lib/config";

/**
 * Server-side Supabase client bound to the request's cookies, so it sees the
 * signed-in session. Returns null when Supabase isn't configured.
 */
export async function supabaseServer() {
  if (!authEnabled) return null;
  const store = await cookies();
  return createServerClient(cfg.url!, cfg.anonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (all) => {
        try {
          all.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // middleware.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS, so it is used in exactly one place:
 * the Stripe webhook, which is the only thing allowed to grant an entitlement.
 * Never import this from a client component.
 */
export function supabaseAdmin() {
  if (!adminEnabled) return null;
  return createClient(cfg.url!, cfg.serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
