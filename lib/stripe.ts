import "server-only";
import Stripe from "stripe";
import { stripe as cfg } from "@/lib/config";

/** Stripe client, or null when the keys aren't set yet. */
export function stripeClient(): Stripe | null {
  const key = cfg.secretKey;
  if (!key) return null;
  return new Stripe(key);
}
