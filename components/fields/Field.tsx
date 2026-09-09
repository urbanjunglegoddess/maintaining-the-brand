"use client";
import { useState } from "react";
import type { Field, ColorCardValue, LogRow } from "@/lib/types";
import { getAnswer, setAnswer } from "@/lib/store";

// Ported from the v1 web resource: one component per field type, bound to the answer store.
// onChange bubbles up so the Workbook can recompute progress.

export default function FieldView({
  section,
  field,
  idx,
  onChange,
}: {
  section: string;
  field: Field;
  idx: number;
  onChange: () => void;
}) {
  const cur = getAnswer(section, idx);
  const commit = (v: unknown) => {
    setAnswer(section, idx, v as never);
    onChange();
  };

  if (field.type === "text") {
    return (
      <div className="mt-5">
        {field.label && <label className="block text-sm font-semibold mb-1">{field.label}</label>}
        <input
          type="text"
          defaultValue={(cur as string) || ""}
          onChange={(e) => commit(e.target.value)}
          className="w-full rounded-lg border border-fieldb bg-field px-3 py-2.5 text-[15px] outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="mt-5">
        {field.label && <label className="block text-sm font-semibold mb-1">{field.label}</label>}
        {field.hint && <div className="text-[13px] text-muted italic mb-2">{field.hint}</div>}
        <textarea
          rows={3}
          defaultValue={(cur as string) || ""}
          onChange={(e) => commit(e.target.value)}
          className="w-full min-h-[84px] resize-y rounded-lg border border-fieldb bg-field px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
      </div>
    );
  }

  if (field.type === "imagenote") {
    return (
      <div className="mt-5">
        <div className="rounded-xl border border-dashed border-fieldb bg-paper/60 p-4">
          <div className="text-[13px] text-muted italic mb-2">{field.label || "Image"}</div>
          <input
            type="text"
            placeholder="Describe or paste a link to the image / color / font you'll use…"
            defaultValue={(cur as string) || ""}
            onChange={(e) => commit(e.target.value)}
            className="w-full rounded-lg border border-fieldb bg-field px-3 py-2.5 text-[15px] outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
          />
        </div>
      </div>
    );
  }

  if (field.type === "check") {
    const [on, setOn] = useState(cur === true);
    return (
      <label className="mt-2.5 flex items-start gap-3 rounded-lg border border-rule bg-field px-3 py-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            setOn(e.target.checked);
            commit(e.target.checked);
          }}
          className="mt-0.5 h-[19px] w-[19px] accent-ember"
        />
        <span className="text-[15px]">{field.label}</span>
      </label>
    );
  }

  if (field.type === "colorcard") {
    const [val, setVal] = useState<ColorCardValue>(
      typeof cur === "object" && cur && !Array.isArray(cur) ? (cur as ColorCardValue) : {}
    );
    const hexKey = (field.sub || []).find((s) => /hex/i.test(s));
    const swatch = /^#?[0-9a-f]{6}$/i.test(val[hexKey || ""] || "")
      ? "#" + (val[hexKey || ""] || "").replace("#", "")
      : "#DCA424";
    const update = (k: string, v: string) => {
      const next = { ...val, [k]: v };
      setVal(next);
      commit(next);
    };
    return (
      <div className="mt-5 rounded-xl border border-fieldb bg-field p-3.5 shadow-card">
        <div
          className="mb-3 flex h-14 items-end justify-end rounded-lg border border-fieldb p-1.5"
          style={{ background: swatch }}
        >
          {hexKey && (
            <input
              type="color"
              value={swatch}
              onChange={(e) => update(hexKey, e.target.value.toUpperCase())}
              className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Pick color"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {(field.sub || []).map((sl) => (
            <div key={sl}>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted">{sl}</label>
              <input
                type="text"
                value={val[sl] || ""}
                onChange={(e) => update(sl, e.target.value)}
                className="w-full rounded-md border border-fieldb bg-field px-2.5 py-1.5 text-[13px] outline-none focus:border-ember"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "logtable") {
    const [rows, setRows] = useState<LogRow[]>(
      Array.isArray(cur) && cur.length
        ? (cur as LogRow[])
        : [
            { date: "", what: "" },
            { date: "", what: "" },
            { date: "", what: "" },
          ]
    );
    const edit = (i: number, k: keyof LogRow, v: string) => {
      const next = rows.map((r, ri) => (ri === i ? { ...r, [k]: v } : r));
      setRows(next);
      commit(next);
    };
    return (
      <div className="mt-5">
        <div className="overflow-hidden rounded-xl border border-fieldb">
          <div className="grid grid-cols-[130px_1fr] bg-paper text-[10px] uppercase tracking-wider text-muted">
            <div className="border-r border-rule px-3 py-2 font-semibold">Date</div>
            <div className="px-3 py-2 font-semibold">What changed &amp; why</div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[130px_1fr] border-t border-rule">
              <input
                value={r.date}
                onChange={(e) => edit(i, "date", e.target.value)}
                className="border-r border-rule bg-field px-3 py-2 text-[14px] outline-none focus:bg-paper"
              />
              <input
                value={r.what}
                onChange={(e) => edit(i, "what", e.target.value)}
                className="bg-field px-3 py-2 text-[14px] outline-none focus:bg-paper"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            const next = [...rows, { date: "", what: "" }];
            setRows(next);
            commit(next);
          }}
          className="mt-2.5 rounded-lg border border-fieldb bg-field px-3 py-1.5 text-[13px] hover:border-sienna hover:text-sienna"
        >
          + Add row
        </button>
      </div>
    );
  }

  return null;
}
