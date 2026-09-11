"use client";
import { useState } from "react";
import Link from "next/link";

/**
 * What a reader sees in place of a paid section. The section's teaching,
 * example, and fields were never sent to this browser — see lib/preview.ts.
 */
export default function UnlockPanel({
  signedIn,
  payments,
  lockedCount,
}: {
  signedIn: boolean;
  payments: boolean;
  lockedCount: number;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 401) {
        window.location.href = "/login?next=/workbook";
        return;
      }
      setErr(
        data.error === "already_owned"
          ? "You already own this — try refreshing the page."
          : "Checkout didn't open. Give it another try in a moment."
      );
    } catch {
      setErr("Checkout didn't open. Give it another try in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 rounded-xl border border-gold bg-paper p-7 shadow-card">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sienna">
        Part of the full workbook
      </div>
      <h3 className="font-serif text-[24px] font-medium leading-tight">
        This section is waiting for you.
      </h3>
      <p className="mt-3 text-[15px] leading-[1.65] text-muted">
        You&apos;ve been working in the free sections. The other {lockedCount} unlock the whole
        book — voice and tone, logo, color, typography, visuals, motion, collateral, legal, and
        the governance system that keeps it all consistent as you grow.
      </p>
      <p className="mt-3 text-[15px] leading-[1.65] text-muted">
        Everything you&apos;ve already filled in stays exactly where it is.
      </p>

      {payments ? (
        <>
          <button
            onClick={buy}
            disabled={busy}
            className="mt-6 rounded-lg border border-green bg-green px-5 py-2.5 text-[14px] text-[#F6F1E7] hover:bg-green2 disabled:opacity-60"
          >
            {busy ? "Opening checkout…" : signedIn ? "Unlock the full workbook" : "Sign in to unlock"}
          </button>
          {err && <div className="mt-3 text-[13px] text-ember">{err}</div>}
        </>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-line bg-field px-4 py-3 text-[13.5px] text-muted">
          Checkout isn&apos;t switched on yet. Add your Stripe keys to{" "}
          <code className="rounded bg-paper px-1">.env.local</code> and this becomes a real buy
          button — see <code className="rounded bg-paper px-1">docs/CONNECTING.md</code>.
        </div>
      )}

      {!signedIn && payments && (
        <div className="mt-4 text-[13px] text-muted">
          Already bought it?{" "}
          <Link href="/login?next=/workbook" className="text-sienna underline">
            Sign in
          </Link>
          .
        </div>
      )}
    </div>
  );
}
