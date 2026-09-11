import Link from "next/link";
import { bundledBook } from "@/lib/content";
import { authEnabled, paymentsEnabled } from "@/lib/config";
import { getViewer } from "@/lib/auth";
import { FREE_SECTIONS } from "@/lib/preview";

export const dynamic = "force-dynamic";

export default async function Home() {
  const book = bundledBook();
  const parts = book.parts.length;
  const sections = book.parts.reduce((n, p) => n + p.sections.length, 0);
  const fields = book.parts.reduce(
    (n, p) => n + p.sections.reduce((m, s) => m + s.fields.length, 0),
    0
  );
  const viewer = authEnabled ? await getViewer() : null;

  return (
    <main>
      {/* Hero */}
      <section
        className="px-6 py-20 text-[#E8E6E1] md:py-28"
        style={{ background: "linear-gradient(165deg,#063a25,#042D1D 55%,#07160F)" }}
      >
        <div className="mx-auto max-w-[880px]">
          <div className="mb-5 text-[10px] uppercase tracking-[0.3em] text-gold">
            A Brand Workbook
          </div>
          <h1 className="max-w-[15ch] font-serif text-[46px] font-medium leading-[1.04] text-[#F6F1E7] md:text-[64px]">
            Build a brand you can actually keep.
          </h1>
          <p className="mt-7 max-w-[58ch] text-[17px] leading-[1.7] text-[#C9BEAA]">
            Not a logo. Not a mood board. The whole identity — the story underneath it, the voice
            that carries it, the colors and type and rules that hold it together six months from
            now when you&apos;re tired and shipping fast.
          </p>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.7] text-[#C9BEAA]">
            For a company, an app, a product, a side project, or just you. If it needs a brand, it
            belongs in this book.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/workbook"
              className="rounded-lg border border-gold bg-gold px-6 py-3 text-[15px] font-medium text-[#241E17] hover:bg-[#e8b744]"
            >
              {paymentsEnabled ? "Start free" : "Open the workbook"}
            </Link>
            {authEnabled &&
              (viewer ? (
                <Link href="/account" className="text-[14.5px] text-[#C9BEAA] underline">
                  Your account
                </Link>
              ) : (
                <Link href="/login" className="text-[14.5px] text-[#C9BEAA] underline">
                  Sign in
                </Link>
              ))}
          </div>

          <div className="mt-14 flex flex-wrap gap-x-10 gap-y-4 border-t border-gold/25 pt-7 text-[13px] text-[#A99D8B]">
            <Stat n={parts} label="parts" />
            <Stat n={sections} label="guided sections" />
            <Stat n={fields} label="things you'll write" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ground px-6 py-20">
        <div className="mx-auto max-w-[880px]">
          <h2 className="font-serif text-[32px] font-medium">Every section works the same way.</h2>
          <p className="mt-3 max-w-[58ch] text-[15.5px] leading-[1.7] text-muted">
            You are never dropped in front of a blank box and told to be brilliant.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Card n="01" title="We teach it">
              What this piece of a brand actually is, why it matters, and what happens when you
              skip it. Plain language, no jargon tax.
            </Card>
            <Card n="02" title="We show you">
              A worked example from Fernloom Goods — a small maker of hand-poured candles and
              ceramics — so you can see what &ldquo;done&rdquo; looks like before you try it.
            </Card>
            <Card n="03" title="You do it">
              Numbered steps, gentle hints, and a place to draft it. Your answers save as you go.
            </Card>
          </div>
        </div>
      </section>

      {/* Contents */}
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-[880px]">
          <h2 className="font-serif text-[32px] font-medium">What&apos;s inside</h2>
          <ol className="mt-8 grid gap-x-10 gap-y-1 sm:grid-cols-2">
            {book.parts.map((p) => (
              <li key={p.num} className="flex gap-3 border-b border-rule py-2.5 text-[15px]">
                <span className="w-6 flex-none font-serif text-[13px] text-gold">{p.num}</span>
                <span className="flex-1">{p.name}</span>
                <span className="text-[12.5px] tabular-nums text-muted">{p.sections.length}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Close */}
      <section className="bg-ground px-6 py-20">
        <div className="mx-auto max-w-[620px] text-center">
          <h2 className="font-serif text-[30px] font-medium leading-tight">
            Start with your brand story. It&apos;s free.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.7] text-muted">
            {paymentsEnabled
              ? `The first ${FREE_SECTIONS.length} sections are open to everyone — enough to get your
                 story, your mission, and your values down on paper. Unlock the rest when you're ready.`
              : `Every section is open. Work through it at your own pace, and download the whole
                 thing as a PDF when you're done.`}
          </p>
          <Link
            href="/workbook"
            className="mt-8 inline-block rounded-lg border border-green bg-green px-6 py-3 text-[15px] text-[#F6F1E7] hover:bg-green2"
          >
            Open the workbook
          </Link>
        </div>
      </section>

      <footer className="border-t border-rule bg-ground px-6 py-10 text-center text-[12.5px] text-muted">
        <div>Maintaining the Brand — an Urban Jungle Goddess product.</div>
        <div className="mt-1.5">
          Examples use a fictional brand. Any resemblance to a real business is coincidental.
        </div>
      </footer>
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-serif text-[26px] text-gold">{n}</div>
      <div className="tracking-wide">{label}</div>
    </div>
  );
}

function Card({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-6 shadow-card">
      <div className="mb-3 font-serif text-[13px] text-gold">{n}</div>
      <h3 className="mb-2 font-serif text-[19px] font-medium">{title}</h3>
      <p className="text-[14.5px] leading-[1.65] text-muted">{children}</p>
    </div>
  );
}
