"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Sign-in. Magic link by email, plus Google when it's enabled in the Supabase
 * dashboard. Both land back on /auth/callback, which sets the session cookie.
 */
export default function AuthForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  async function google() {
    const sb = supabaseBrowser();
    if (!sb) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    // On success the browser is already navigating away, so only the
    // failure path needs to release the button.
    if (error) {
      setBusy(false);
      setErr(error.message);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-gold bg-paper p-6 text-[15px] leading-[1.65] shadow-card">
        <div className="mb-2 font-serif text-[20px]">Check your email.</div>
        <p className="text-muted">
          We sent a sign-in link to <strong className="text-ink">{email}</strong>. Open it on this
          device and you&apos;ll land right back in your workbook.
        </p>
        <button onClick={() => setSent(false)} className="mt-4 text-[13px] text-sienna underline">
          Use a different address
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={sendLink}>
        <label className="mb-1.5 block text-[13px] font-semibold">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-fieldb bg-field px-3 py-2.5 text-[15px] outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 w-full rounded-lg border border-green bg-green px-4 py-2.5 text-[14.5px] text-[#F6F1E7] hover:bg-green2 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[12px] text-muted">
        <span className="h-px flex-1 bg-rule" />
        or
        <span className="h-px flex-1 bg-rule" />
      </div>

      <button
        onClick={google}
        disabled={busy}
        className="w-full rounded-lg border border-line bg-field px-4 py-2.5 text-[14.5px] hover:border-sienna hover:text-sienna disabled:opacity-60"
      >
        Continue with Google
      </button>

      {err && <div className="mt-4 text-[13px] text-ember">{err}</div>}

      <p className="mt-6 text-[12.5px] leading-relaxed text-muted">
        No password to remember. Anything you&apos;ve already filled in on this device comes with
        you when you sign in.
      </p>
    </div>
  );
}
