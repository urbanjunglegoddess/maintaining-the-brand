import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { stripe as cfg, PRODUCT } from "@/lib/config";

/**
 * The only thing in the system that grants access.
 *
 * Stripe's signature is verified before anything is read from the body, and
 * the write uses the service-role key because the entitlements table has no
 * client-writable policy. A forged request can't reach the database.
 *
 * Point Stripe at:  POST {siteUrl}/api/stripe/webhook
 * Events:           checkout.session.completed, charge.refunded,
 *                   charge.dispute.created
 */

export const dynamic = "force-dynamic";
// The raw body is required for signature verification — don't let anything parse it first.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = stripeClient();
  const secret = cfg.webhookSecret;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "payments_disabled" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[webhook] bad signature", err);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const db = supabaseAdmin();
  if (!db) {
    // Returning 500 makes Stripe retry, which is what we want: the payment
    // happened, the entitlement just hasn't landed yet.
    console.error("[webhook] service-role key missing; cannot grant entitlement");
    return NextResponse.json({ error: "admin_unavailable" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status !== "paid") break;

        const userId = s.metadata?.user_id ?? s.client_reference_id ?? null;
        if (!userId) {
          console.error("[webhook] paid session with no user_id", s.id);
          break; // ack — retrying won't conjure a user id. Reconcile by hand.
        }

        const { error } = await db.from("entitlements").upsert(
          {
            user_id: userId,
            product: PRODUCT,
            status: "active",
            stripe_session: s.id,
            granted_at: new Date().toISOString(),
          },
          { onConflict: "user_id,product" }
        );
        if (error) throw error;

        // Remember the customer so a repeat checkout reuses it.
        if (typeof s.customer === "string") {
          await db.from("profiles").update({ stripe_customer_id: s.customer }).eq("id", userId);
        }
        break;
      }

      case "charge.refunded":
      case "charge.dispute.created": {
        const c = event.data.object as Stripe.Charge | Stripe.Dispute;
        const meta = "metadata" in c ? c.metadata : undefined;
        const userId = meta?.user_id;
        if (!userId) break;
        const { error } = await db
          .from("entitlements")
          .update({ status: "refunded" })
          .eq("user_id", userId)
          .eq("product", PRODUCT);
        if (error) throw error;
        break;
      }

      default:
        break; // ack everything else
    }
  } catch (err) {
    console.error("[webhook] handler failed", event.type, err);
    // 500 → Stripe retries with backoff. The upsert is idempotent, so a
    // replay is harmless.
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
