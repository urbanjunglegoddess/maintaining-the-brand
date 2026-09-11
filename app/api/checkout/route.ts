import { NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { hasFullAccess } from "@/lib/entitlement";
import { paymentsEnabled, siteUrl, stripe as cfg, PRODUCT } from "@/lib/config";

/**
 * Start a one-time Checkout for the workbook.
 *
 * The user id is carried in both client_reference_id and metadata so the
 * webhook can match the payment back to an account. Nothing here grants
 * access — only the webhook does that.
 */

export const dynamic = "force-dynamic";

export async function POST() {
  if (!paymentsEnabled) {
    return NextResponse.json({ error: "payments_disabled" }, { status: 503 });
  }

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Don't let someone buy the same thing twice.
  if (await hasFullAccess(viewer)) {
    return NextResponse.json({ error: "already_owned" }, { status: 409 });
  }

  const stripe = stripeClient();
  if (!stripe) return NextResponse.json({ error: "payments_disabled" }, { status: 503 });

  // Reuse this account's Stripe customer if we've made one before, so a
  // repeat visitor doesn't get a duplicate customer record.
  let customerId: string | undefined;
  const sb = await supabaseServer();
  if (sb) {
    const { data } = await sb
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", viewer.id)
      .maybeSingle();
    customerId = data?.stripe_customer_id ?? undefined;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: cfg.priceId!, quantity: 1 }],
      client_reference_id: viewer.id,
      metadata: { user_id: viewer.id, product: PRODUCT },
      payment_intent_data: { metadata: { user_id: viewer.id, product: PRODUCT } },
      ...(customerId ? { customer: customerId } : { customer_email: viewer.email ?? undefined }),
      allow_promotion_codes: true,
      success_url: `${siteUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/workbook`,
    });

    if (!session.url) throw new Error("no session url");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] failed", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
