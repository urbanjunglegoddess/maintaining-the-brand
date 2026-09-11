/**
 * Which external services are wired up right now.
 *
 * The whole app is built to run with none of them. Every feature that needs a
 * service checks the matching flag here and falls back to a local equivalent:
 *
 *   Supabase absent → "local mode": no accounts, answers live in localStorage.
 *   Stripe absent   → "open mode":  nothing is gated, every section is readable.
 *
 * Turning a service on is an env-var change and a redeploy. No code moves.
 * See docs/CONNECTING.md for the order to do it in.
 */

const env = (k: string) => {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
};

// NEXT_PUBLIC_* are inlined at build time, so these must be read as literals
// rather than through a variable key — Next can't statically replace env[k].
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;

export const supabase = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON,
  /** Server-only. Never referenced from a client component. */
  get serviceKey() {
    return env("SUPABASE_SERVICE_ROLE_KEY");
  },
};

export const stripe = {
  get secretKey() {
    return env("STRIPE_SECRET_KEY");
  },
  get priceId() {
    return env("STRIPE_PRICE_ID");
  },
  get webhookSecret() {
    return env("STRIPE_WEBHOOK_SECRET");
  },
};

/** Accounts + cloud-synced answers are available. */
export const authEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON);

/** The webhook can write entitlements (needs the service-role key). */
export const adminEnabled = Boolean(SUPABASE_URL && env("SUPABASE_SERVICE_ROLE_KEY"));

/**
 * Purchases are possible. Gating is deliberately tied to *both* Stripe and auth:
 * locking content when nobody can sign in or pay would strand the reader.
 */
export const paymentsEnabled = Boolean(
  authEnabled && env("STRIPE_SECRET_KEY") && env("STRIPE_PRICE_ID")
);

/** True when content should be gated at all. */
export const gatingEnabled = paymentsEnabled;

export const siteUrl =
  env("NEXT_PUBLIC_SITE_URL") ||
  (env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : "http://localhost:3000");

export const PRODUCT = "maintaining_the_brand";

/** One object for the client, so components can render the right affordances. */
export type RuntimeMode = {
  auth: boolean;
  payments: boolean;
  /** "local" = answers in this browser. "cloud" = answers on the account. */
  storage: "local" | "cloud";
};

export function runtimeMode(signedIn: boolean): RuntimeMode {
  return {
    auth: authEnabled,
    payments: paymentsEnabled,
    storage: authEnabled && signedIn ? "cloud" : "local",
  };
}
