import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { hasFullAccess } from "@/lib/entitlement";

/**
 * Landing spot after a successful Checkout.
 *
 * Access is granted by the webhook, which can arrive a beat after the reader
 * does. So this page never asserts what it hasn't confirmed: if the
 * entitlement isn't visible yet, it says so plainly and offers a refresh
 * rather than sending them into a workbook that's still locked.
 */
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const viewer = await getViewer();
  const full = await hasFullAccess(viewer);

  return (
    <main className="mx-auto max-w-[560px] px-6 py-24 text-center">
      <div className="mb-3 text-[11px] uppercase tracking-[0.26em] text-sienna">
        {full ? "You're in" : "Payment received"}
      </div>
      <h1 className="font-serif text-[38px] font-medium leading-tight">
        {full ? "The whole book is open." : "Just a moment…"}
      </h1>

      {full ? (
        <>
          <p className="mx-auto mt-5 max-w-[440px] text-[15.5px] leading-[1.7] text-muted">
            Every section is unlocked, and everything you already filled in is right where you
            left it. Take it one part at a time — the book is built to be walked, not raced.
          </p>
          <Link
            href="/workbook"
            className="mt-9 inline-block rounded-lg border border-green bg-green px-6 py-3 text-[15px] text-[#F6F1E7] hover:bg-green2"
          >
            Open your workbook
          </Link>
        </>
      ) : (
        <>
          <p className="mx-auto mt-5 max-w-[440px] text-[15.5px] leading-[1.7] text-muted">
            Your payment went through. We&apos;re waiting on the confirmation from Stripe to
            unlock your account — it usually takes a few seconds. Refresh this page and it should
            be done.
          </p>
          <Link
            href="/welcome"
            className="mt-9 inline-block rounded-lg border border-green bg-green px-6 py-3 text-[15px] text-[#F6F1E7] hover:bg-green2"
          >
            Refresh
          </Link>
          <p className="mt-6 text-[13px] text-muted">
            Still locked after a minute or two? Email us and we&apos;ll sort it out by hand —
            your receipt from Stripe is all we need.
          </p>
        </>
      )}
    </main>
  );
}
