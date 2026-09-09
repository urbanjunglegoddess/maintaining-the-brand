"use client";
import type { AnswerValue } from "./types";

/**
 * Answer store abstraction.
 *
 * Phase 0 (this file): localStorage, keyed by section + field index — identical model to the
 * published web resource, so the app runs today with zero backend.
 *
 * Phase 1: replace the body of load()/save() with calls to /api/answers (GET all on mount,
 * debounced PUT on change). The component API below does not change, so only this file moves.
 */

const KEY = "mtb_answers_v1";
type Store = Record<string, Record<number, AnswerValue>>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

let cache: Store | null = null;
function all(): Store {
  if (cache === null) cache = read();
  return cache;
}

export function getAnswer(section: string, idx: number): AnswerValue {
  return all()[section]?.[idx];
}

export function setAnswer(section: string, idx: number, value: AnswerValue) {
  const store = all();
  (store[section] ||= {})[idx] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode / quota — fail soft */
  }
}
