"use client";
import type { AnswerValue } from "./types";

/**
 * The answer store.
 *
 * Components read it synchronously (`getAnswer`) and write through it
 * (`setAnswer`). Where the bytes actually land depends on the mode it was
 * configured with, and nothing above this file knows the difference:
 *
 *   "local" → localStorage in this browser. Works with no backend at all.
 *   "cloud" → GET /api/answers on hydrate, debounced PUT on change.
 *
 * Switching a signed-in reader from local to cloud is what `migrateLocal`
 * is for: the answers they filled in before making an account come with them.
 */

export type Mode = "local" | "cloud";
export type SaveState = "idle" | "saving" | "saved" | "error";

const KEY = "mtb_answers_v1";
const FLUSH_MS = 700;

type Store = Record<string, Record<number, AnswerValue>>;

let mode: Mode = "local";
let cache: Store = {};
let ready = false;
let saveState: SaveState = "idle";

const listeners = new Set<() => void>();
const dirty = new Map<string, { section: string; idx: number }>();
let timer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isReady() {
  return ready;
}
export function getMode() {
  return mode;
}
export function getSaveState() {
  return saveState;
}

function setSaveState(s: SaveState) {
  saveState = s;
  emit();
}

// ── local backing ───────────────────────────────────────────────────────────

function readLocal(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocal(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode / quota — fail soft rather than lose the session */
  }
}

export function hasLocalAnswers(): boolean {
  const s = readLocal();
  return Object.values(s).some((sec) => Object.keys(sec).length > 0);
}

// ── setup ───────────────────────────────────────────────────────────────────

/**
 * Point the store at a backend and load what's already there.
 * Safe to call again when the mode changes (e.g. after sign-in).
 */
export async function configureStore(next: Mode) {
  mode = next;
  ready = false;
  emit();

  if (mode === "local") {
    cache = readLocal();
  } else {
    try {
      const res = await fetch("/api/answers", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      cache = (await res.json()) as Store;
    } catch {
      // Offline or the API is down: fall back to whatever this browser has,
      // so the reader can keep working. Edits re-sync on the next successful PUT.
      cache = readLocal();
      setSaveState("error");
    }
  }

  ready = true;
  emit();
}

/**
 * Push this browser's local answers up to the account, without clobbering
 * anything already saved there. Used once, right after a reader signs in.
 * Returns how many fields moved.
 */
export async function migrateLocal(): Promise<number> {
  const local = readLocal();
  const rows: { section: string; field_idx: number; value: AnswerValue }[] = [];

  for (const [section, fields] of Object.entries(local)) {
    for (const [idx, value] of Object.entries(fields)) {
      const i = Number(idx);
      if (cache[section]?.[i] !== undefined) continue; // cloud already has it — cloud wins
      rows.push({ section, field_idx: i, value });
      (cache[section] ||= {})[i] = value;
    }
  }

  if (!rows.length) return 0;
  try {
    const res = await fetch("/api/answers", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: rows }),
    });
    if (!res.ok) throw new Error(String(res.status));
    emit();
    return rows.length;
  } catch {
    setSaveState("error");
    return 0;
  }
}

// ── read / write ────────────────────────────────────────────────────────────

export function getAnswer(section: string, idx: number): AnswerValue {
  return cache[section]?.[idx];
}

export function getAll(): Store {
  return cache;
}

export function setAnswer(section: string, idx: number, value: AnswerValue) {
  (cache[section] ||= {})[idx] = value;

  if (mode === "local") {
    writeLocal(cache);
    return;
  }

  dirty.set(`${section}:${idx}`, { section, idx });
  setSaveState("saving");
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, FLUSH_MS);
}

async function flush() {
  timer = null;
  if (!dirty.size) return;

  const batch = [...dirty.values()].map(({ section, idx }) => ({
    section,
    field_idx: idx,
    value: cache[section]?.[idx],
  }));
  dirty.clear();

  try {
    const res = await fetch("/api/answers", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: batch }),
    });
    if (!res.ok) throw new Error(String(res.status));
    setSaveState(dirty.size ? "saving" : "saved");
  } catch {
    // Keep a local copy so nothing is lost, and put the rows back in the queue.
    writeLocal(cache);
    batch.forEach((b) => dirty.set(`${b.section}:${b.field_idx}`, { section: b.section, idx: b.field_idx }));
    setSaveState("error");
  }
}

/** Best-effort save on tab close. */
export function flushNow() {
  if (mode === "cloud" && dirty.size) void flush();
}
