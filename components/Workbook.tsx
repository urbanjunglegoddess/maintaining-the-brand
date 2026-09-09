"use client";
import { useMemo, useState } from "react";
import type { Book, Field as TField } from "@/lib/types";
import { flattenSections } from "@/lib/content";
import { getAnswer } from "@/lib/store";
import FieldView from "@/components/fields/Field";

function isFilled(f: TField, v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (f.type === "check") return v === true;
  if (f.type === "colorcard")
    return typeof v === "object" && Object.values(v as object).some((x) => x && String(x).trim());
  if (f.type === "logtable")
    return Array.isArray(v) && v.some((r) => (r.date || "").trim() || (r.what || "").trim());
  return String(v).trim().length > 0;
}

export default function Workbook({ book }: { book: Book }) {
  const secs = useMemo(() => flattenSections(book), [book]);
  const [active, setActive] = useState(secs[0].num);
  const [open, setOpen] = useState<number>(secs[0] ? book.parts[0].num : 1);
  const [drawer, setDrawer] = useState(false);
  const [, force] = useState(0);
  const tick = () => force((n) => n + 1);

  const totals = useMemo(() => {
    let f = 0,
      t = 0;
    secs.forEach((s) =>
      s.fields.forEach((fd, i) => {
        t++;
        if (isFilled(fd, getAnswer(s.num, i))) f++;
      })
    );
    return { f, t, pct: t ? Math.round((f / t) * 100) : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs, active, force]);

  const sec = secs.find((s) => s.num === active)!;
  const idx = secs.findIndex((s) => s.num === active);

  const go = (num: string) => {
    setActive(num);
    setDrawer(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

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
            <h1 className="font-serif text-2xl font-medium leading-[1.05] text-[#F6F1E7]">
              Maintaining
              <br />
              the Brand
            </h1>
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
                        const done = s.fields.length > 0 && s.fields.every((fd, i) => isFilled(fd, getAnswer(s.num, i)));
                        const isActive = s.num === active;
                        return (
                          <button
                            key={s.num}
                            onClick={() => go(s.num)}
                            className={`flex w-full gap-2.5 py-1.5 pl-[34px] pr-5 text-left text-[12.5px] leading-tight ${
                              isActive ? "bg-ember/[0.16] text-white shadow-[inset_3px_0_0_var(--ember)]" : "text-[#CFC6B5] hover:bg-white/5 hover:text-[#F6F1E7]"
                            }`}
                          >
                            <span className={`mt-1.5 h-[7px] w-[7px] flex-none rounded-full border-[1.5px] ${done ? "border-gold bg-gold" : "border-gold/50"}`} />
                            <span className="min-w-[26px] tabular-nums text-gold">{s.num}</span>
                            <span>{s.title}</span>
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
          <button className="rounded-lg border border-line bg-field px-3 py-1.5 text-[12.5px] md:hidden" onClick={() => setDrawer(true)}>
            ☰ Parts
          </button>
          <div className="flex-1" />
          <span className="text-[13px] tabular-nums text-muted">{totals.pct}% complete</span>
        </div>

        <div className="mx-auto max-w-[760px] px-6 pb-24 pt-8 md:px-8">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sienna">
            Part {sec.partNum} · {sec.partName}
          </div>
          <h2 className="text-balance font-serif text-[34px] font-medium leading-[1.08] tracking-[-0.01em]">
            <span className="mr-1 text-ember">{sec.num}</span>
            {sec.title}
          </h2>
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
                {sec.exWho && <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sienna">{sec.exWho}</div>}
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
            {sec.fields.map((f, i) => (
              <FieldView key={`${sec.num}-${i}`} section={sec.num} field={f} idx={i} onChange={tick} />
            ))}
          </div>

          <div className="mt-11 flex justify-between gap-3 border-t border-rule pt-6">
            <button
              onClick={() => idx > 0 && go(secs[idx - 1].num)}
              className={`rounded-lg border border-line bg-field px-3 py-2 text-[12.5px] ${idx > 0 ? "" : "invisible"}`}
            >
              ← {idx > 0 ? `${secs[idx - 1].num} ${secs[idx - 1].title}` : ""}
            </button>
            {idx < secs.length - 1 ? (
              <button
                onClick={() => go(secs[idx + 1].num)}
                className="rounded-lg border border-green bg-green px-3 py-2 text-[12.5px] text-[#F6F1E7] hover:bg-green2"
              >
                {secs[idx + 1].num} {secs[idx + 1].title} →
              </button>
            ) : (
              <span className="rounded-lg border border-line px-3 py-2 text-[12.5px] text-muted">Done ✦</span>
            )}
          </div>

          <div className="mt-6 text-center text-[12px] italic text-muted">
            Phase 0: answers save in this browser. Phase 1 syncs them to your account. ✦
          </div>
        </div>
      </main>
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
