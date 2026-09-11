import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { gatingEnabled, PRODUCT } from "@/lib/config";
import type { Viewer } from "@/lib/auth";

/**
 * Does this viewer get the full workbook?
 *
 * While payments are unconfigured, gating is off and everyone does — that's what
 * makes the app usable before Stripe exists. The moment STRIPE_SECRET_KEY and
 * STRIPE_PRICE_ID are set, this starts asking the entitlements table, and the
 * only writer of that table is the Stripe webhook.
 *
 * This runs on the server only. Locked content is removed before the page is
 * rendered (see lib/preview.ts), so it never reaches the browser at all.
 */
export async function hasFullAccess(viewer: Viewer | null): Promise<boolean> {
  if (!gatingEnabled) return true;
  if (!viewer) return false;

  const sb = await supabaseServer();
  if (!sb) return false;

  const { data, error } = await sb
    .from("entitlements")
    .select("status")
    .eq("user_id", viewer.id)
    .eq("product", PRODUCT)
    .maybeSingle();

  if (error || !data) return false;
  return data.status === "active";
}
