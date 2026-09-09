// PHASE 2 — the ONLY thing that grants access. Verifies Stripe's signature,
// then inserts an entitlement with the service-role key. Never trust the client.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // let event;
  // try {
  //   event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  // } catch {
  //   return NextResponse.json({ error: "bad signature" }, { status: 400 });
  // }
  // if (event.type === "checkout.session.completed") {
  //   const s = event.data.object as Stripe.Checkout.Session;
  //   const userId = s.metadata?.user_id;
  //   if (userId) {
  //     await supabaseAdmin().from("entitlements").upsert({
  //       user_id: userId,
  //       product: "maintaining_the_brand",
  //       status: "active",
  //       stripe_session: s.id,
  //     });
  //   }
  // }
  void sig; void body;
  return NextResponse.json({ received: true, todo: "phase 2: verify + grant entitlement" });
}
