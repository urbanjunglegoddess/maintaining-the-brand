import Link from "next/link";
import { redirect } from "next/navigation";
import { authEnabled } from "@/lib/config";
import { getViewer } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/workbook";

  if (authEnabled) {
    const viewer = await getViewer();
    if (viewer) redirect(dest);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[460px] flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 block">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.26em] text-sienna">
          A Brand Workbook
        </div>
        <div className="font-serif text-[30px] font-medium leading-[1.05]">
          Maintaining the Brand
        </div>
      </Link>

      {authEnabled ? (
        <>
          <h1 className="mb-2 font-serif text-[22px] font-medium">Sign in to your workbook</h1>
          <p className="mb-6 text-[14.5px] leading-relaxed text-muted">
            So your answers follow you to every device, and your copy is always here waiting.
          </p>
          {error && (
            <div className="mb-5 rounded-lg border border-ember/40 bg-ember/10 px-4 py-3 text-[13.5px]">
              That sign-in link didn&apos;t work — it may have already been used or expired. Send
              yourself a fresh one.
            </div>
          )}
          <AuthForm next={dest} />
        </>
      ) : (
        <div className="rounded-xl border border-gold bg-paper p-6 shadow-card">
          <h1 className="mb-2 font-serif text-[21px] font-medium">Accounts aren&apos;t on yet</h1>
          <p className="text-[14.5px] leading-relaxed text-muted">
            The workbook is running in local mode — everything you fill in is saved in this
            browser, and every section is open. Add your Supabase keys to{" "}
            <code className="rounded bg-field px-1">.env.local</code> to switch accounts on.
          </p>
          <Link
            href="/workbook"
            className="mt-5 inline-block rounded-lg border border-green bg-green px-4 py-2.5 text-[14px] text-[#F6F1E7] hover:bg-green2"
          >
            Open the workbook
          </Link>
        </div>
      )}
    </main>
  );
}
