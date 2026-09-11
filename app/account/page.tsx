import Link from "next/link";
import { redirect } from "next/navigation";
import { authEnabled, paymentsEnabled } from "@/lib/config";
import { getProfile, getViewer } from "@/lib/auth";
import { hasFullAccess } from "@/lib/entitlement";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!authEnabled) redirect("/workbook");

  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/account");

  const [profile, full] = await Promise.all([getProfile(viewer), hasFullAccess(viewer)]);

  return (
    <main className="mx-auto max-w-[640px] px-6 py-16">
      <Link href="/workbook" className="text-[13px] text-sienna underline">
        ← Back to the workbook
      </Link>

      <h1 className="mt-6 font-serif text-[32px] font-medium">Your account</h1>

      <dl className="mt-8 divide-y divide-rule border-y border-rule">
        <Row label="Email">{viewer.email ?? "—"}</Row>
        <Row label="Name">{profile?.display_name || "—"}</Row>
        <Row label="Member since">
          {profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "—"}
        </Row>
        <Row label="Workbook">
          {full ? (
            <span className="text-green">Full access ✦</span>
          ) : paymentsEnabled ? (
            <span className="text-muted">Free sections only</span>
          ) : (
            <span className="text-muted">Full access (checkout not switched on)</span>
          )}
        </Row>
      </dl>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/workbook"
          className="rounded-lg border border-green bg-green px-4 py-2.5 text-[14px] text-[#F6F1E7] hover:bg-green2"
        >
          Open the workbook
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg border border-line bg-field px-4 py-2.5 text-[14px] hover:border-sienna hover:text-sienna"
          >
            Sign out
          </button>
        </form>
      </div>

      <p className="mt-10 text-[13px] leading-relaxed text-muted">
        Your answers are saved to this account and sync across your devices. Download a PDF of
        everything you&apos;ve written any time from the workbook toolbar.
      </p>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-6 py-3.5">
      <dt className="w-[140px] flex-none text-[13px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-[15px]">{children}</dd>
    </div>
  );
}
