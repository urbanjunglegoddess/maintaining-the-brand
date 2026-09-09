// PHASE 2 — create a one-time Stripe Checkout session tagged with the user_id.
import { NextResponse } from "next/server";

export async function POST() {
  // const sb = await supabaseServer();
  // const { data: { user } } = await sb.auth.getUser();
  // if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({
  //   mode: "payment",
  //   line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
  //   client_reference_id: user.id,
  //   metadata: { user_id: user.id, product: "maintaining_the_brand" },
  //   success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/welcome?s={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/workbook`,
  // });
  // return NextResponse.json({ url: session.url });
  return NextResponse.json({ todo: "phase 2: create Stripe Checkout session, return url" });
}
