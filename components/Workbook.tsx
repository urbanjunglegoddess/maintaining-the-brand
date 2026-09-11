"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Field as TField } from "@/lib/types";
import type { ViewerBook, MaybeLockedSection } from "@/lib/preview";
import type { RuntimeMode } from "@/lib/config";
import { flattenSections } from "@/lib/sections";
import {
  configureStore,
  flushNow,
  getAnswer,
  getAll,
  getSaveState,
  hasLocalAnswers,
  isReady,
  migrateLocal,
  subscribe,
} from "@/lib/store";
import { isFilled } from "@/lib/answers-format";
import FieldView from "@/components/fields/Field";
import UnlockPanel from "@/components/UnlockPanel";

export default function Workbook({
  book,
  mode,
  email,
  fullAccess,
  lockedCount,
  justSignedIn,
}: {
  book: ViewerBook;
  mode: RuntimeMode;
  email: string | null;
  fullAccess: boolean;
  lockedCount: number;
  justSignedIn: boolean;
}) {
  const secs = useMemo(() => flattenSections(book), [book]);
  const [active, setActive] = useState(secs[0].num);
  const [open, setOpen] = useState<number>(book.parts[0]?.num ?? 1);
  const [drawer, setDrawer] = useState(false);
  const [version, setVersion] = useState(0);
  const [migrated, setMigrated] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const bump = useCallback(() => setVersion((n) => n + 1), []);

  // Wire the store to the right backend, then re-render as it loads.
  useEffect(() => {
    const unsub = subscribe(bump);
    void (async () => {
      await configureStore(mode.storage);
      // A reader who filled things in before making an account keeps their work.
      if (mode.storage === "cloud" && justSignedIn && hasLocalAnswers()) {
        const n = await migrateLocal();
        if (n > 0) setMigrated(n);
      }
    })();
    return () => {
      unsub();
    };
  }, [mode.storage, justSignedIn, bump]);

  // Don't lose the last keystroke when the tab closes.
  useEffect(() => {
    const onHide = () => flushNow();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  const ready = isReady();
  const saveState = getSaveState();

  const totals = useMemo(() => {
    let f = 0;
    let t = 0;
    secs.forEach((s) =>
      s.fields.forEach((fd, i) => {
        t++;
        if (isFilled(fd, getAnswer(s.num, i))) f++;
      })
    );
    return { f, t, pct: t ? Math.round((f / t) * 100) : 0 };
  }, [secs, version]);

  const sec = secs.find((s) => s.num === active)!;
  const idx = secs.findIndex((s) => s.num === active);
  const locked = Boolean((sec as MaybeLockedSection).locked);

  const go = (num: string) => {
    setActive(num);
    setDrawer(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: getAll(), filledOnly: true }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fullAccess ? "My-Brand-Book.pdf" : "My-Brand-Book-sample.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("The export didn't come through. Give it another try in a moment.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[290px] transform overflow-hidden text-[#E8E6E1] transition-transform md:static md:w-auto md:translate-x-0 ${
          drawer ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ background: "linear-gradient(170deg,#063a25,#042D1D 55%,#07160F)" }}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-gold/20 px-5 pb-4 pt-6">
            <div className="mb-2 text-[10px] uppercase tracking-[0.26em] text-gold">A Brand Workbook</div>
            <Link href="/" className="font-serif text-2xl font-medium leading-[1.05] text-[#F6F1E7]">
              Maintaining
              <br />
              the Brand
            </Link>
          </div>
          <div className="border-b border-gold/20 px-5 py-3.5">
            <div className="mb-1.5 flex justify-between text-[11px] text-[#C9BEAA]">
              <span>Your progress</span>
              <span>{totals.pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${totals.pct}%`, background: "linear-gradient(90deg,#DCA424,#E86100)" }}
              />
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {book.parts.map((p) => {
              const expanded = open === p.num || p.sections.some((s) => s.num === active);
              return (
                <div key={p.num}>
                  <button
                    onClick={() => setOpen(expanded ? -1 : p.num)}
                    className="flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-[13.5px] hover:bg-white/5"
                  >
                    <span className="min-w-[20px] font-serif text-[13px] font-semibold text-gold">{p.num}</span>
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className={`text-[11px] opacity-60 transition-transform ${expanded ? "rotate-90" : ""}`}>▸</span>
                  </button>
                  {expanded && (
                    <div>
                      {p.sections.map((s) => {
                        const isLocked = Boolean(s.locked);
                        const done =
                          !isLocked &&
                          s.fields.length > 0 &&
                          s.fields.every((fd, i) => isFilled(fd, getAnswer(s.num, i)));
                        const isActive = s.num === active;
                        return (
                          <button
                            key={s.num}
                            onClick={() => go(s.num)}
                            className={`flex w-full gap-2.5 py-1.5 pl-[34px] pr-5 text-left text-[12.5px] leading-tight ${
                              isActive
                                ? "bg-ember/[0.16] text-white shadow-[inset_3px_0_0_var(--ember)]"
                                : "text-[#CFC6B5] hover:bg-white/5 hover:text-[#F6F1E7]"
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-[7px] w-[7px] flex-none rounded-full border-[1.5px] ${
                                done ? "border-gold bg-gold" : "border-gold/50"
                              }`}
                            />
                            <span className="min-w-[26px] tabular-nums text-gold">{s.num}</span>
                            <span className="flex-1">{s.title}</span>
                            {isLocked && <span className="mt-0.5 text-[10px] opacity-55">🔒</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
      {drawer && <div className="fixed inset-0 z-20 bg-black/45 md:hidden" onClick={() => setDrawer(false)} />}

      {/* Main */}
      <main className="min-w-0 bg-ground">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-rule bg-ground/90 px-6 py-3 backdrop-blur md:px-8">
          <button
            className="rounded-lg border border-line bg-field px-3 py-1.5 text-[12.5px] md:hidden"
            onClick={() => setDrawer(true)}
          >
            ☰ Parts
          </button>
          <span className="text-[13px] tabular-nums text-muted">{totals.pct}% complete</span>
          <SaveBadge mode={mode} ready={ready} state={saveState} />
          <div className="flex-1" />
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="rounded-lg border border-line bg-field px-3 py-1.5 text-[12.5px] hover:border-sienna hover:text-sienna disabled:opacity-50"
          >
            {exporting ? "Building…" : "Download PDF"}
          </button>
          {mode.auth ? (
            email ? (
              <Link
                href="/account"
                className="hidden rounded-lg border border-line bg-field px-3 py-1.5 text-[12.5px] hover:border-sienna hover:text-sienna sm:block"
              >
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-green bg-green px-3 py-1.5 text-[12.5px] text-[#F6F1E7] hover:bg-green2"
              >
                Sign in
              </Link>
            )
          ) : null}
        </div>

        {migrated !== null && (
          <Banner onClose={() => setMigrated(null)}>
            Brought {migrated} {migrated === 1 ? "answer" : "answers"} over from this browser into your
            account. They&apos;ll follow you to any device now.
          </Banner>
        )}

        <div className="mx-auto max-w-[760px] px-6 pb-24 pt-8 md:px-8">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sienna">
            Part {sec.partNum} · {sec.partName}
          </div>
          <h2 className="text-balance font-serif text-[34px] font-medium leading-[1.08] tracking-[-0.01em]">
            <span className="mr-1 text-ember">{sec.num}</span>
            {sec.title}
          </h2>

          {locked ? (
            <UnlockPanel signedIn={Boolean(email)} payments={mode.payments} lockedCount={lockedCount} />
          ) : (
            <>
              {sec.tag && <div className="mb-1 mt-2 font-serif text-[17px] italic text-muted">{sec.tag}</div>}

              {sec.desc && (
                <div className="mt-6">
                  <Label>Description</Label>
                  <div className="rich text-[15.5px] leading-[1.68]" dangerouslySetInnerHTML={{ __html: sec.desc }} />
                </div>
              )}

              {sec.ex && (
                <div className="mt-6">
                  <Label>Example</Label>
                  <div className="rounded border-l-[3px] border-gold bg-paper px-5 py-4 shadow-card">
                    {sec.exWho && (
                      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sienna">
                        {sec.exWho}
                      </div>
                    )}
                    <div className="rich text-[14.5px] leading-[1.62]" dangerouslySetInnerHTML={{ __html: sec.ex }} />
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Label>Your Template</Label>
                {sec.intro && (
                  <div className="mb-1.5 rounded-lg border border-dashed border-gold bg-gold/[0.12] px-4 py-3 text-[13.5px]">
                    {sec.intro}
                  </div>
                )}
                {!ready && <div className="py-6 text-[13px] italic text-muted">Loading your answers…</div>}
                {ready &&
                  sec.fields.map((f: TField, i: number) => (
                    // Re-keyed on `version` so fields with internal state pick up
                    // answers that arrive after hydration.
                    <FieldView
                      key={`${sec.num}-${i}-${ready ? "r" : "p"}`}
                      section={sec.num}
                      field={f}
                      idx={i}
                      onChange={bump}
                    />
                  ))}
              </div>
            </>
          )}

          <div className="mt-11 flex justify-between gap-3 border-t border-rule pt-6">
            <button
              onClick={() => idx > 0 && go(secs[idx - 1].num)}
              className={`rounded-lg border border-line bg-field px-3 py-2 text-left text-[12.5px] ${idx > 0 ? "" : "invisible"}`}
            >
              ← {idx > 0 ? `${secs[idx - 1].num} ${secs[idx - 1].title}` : ""}
            </button>
            {idx < secs.length - 1 ? (
              <button
                onClick={() => go(secs[idx + 1].num)}
                className="rounded-lg border border-green bg-green px-3 py-2 text-right text-[12.5px] text-[#F6F1E7] hover:bg-green2"
              >
                {secs[idx + 1].num} {secs[idx + 1].title} →
              </button>
            ) : (
              <span className="rounded-lg border border-line px-3 py-2 text-[12.5px] text-muted">Done ✦</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SaveBadge({
  mode,
  ready,
  state,
}: {
  mode: RuntimeMode;
  ready: boolean;
  state: ReturnType<typeof getSaveState>;
}) {
  if (!ready) return <span className="text-[12px] italic text-muted">Loading…</span>;

  if (mode.storage === "local") {
    return (
      <span className="hidden text-[12px] text-muted sm:inline" title="Answers are saved in this browser only.">
        Saved in this browser
      </span>
    );
  }
  const label =
    state === "saving" ? "Saving…" : state === "error" ? "Offline — saved locally" : "Saved to your account";
  return (
    <span className={`hidden text-[12px] sm:inline ${state === "error" ? "text-ember" : "text-muted"}`}>{label}</span>
  );
}

function Banner({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-start gap-3 border-b border-gold/40 bg-gold/[0.14] px-6 py-3 text-[13.5px] md:px-8">
      <span className="flex-1">{children}</span>
      <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sienna">
      {children}
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}
