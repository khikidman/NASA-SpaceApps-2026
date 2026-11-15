"use client";
import { useEffect, useState, type RefObject } from "react";
import type { TutorialTaskId } from "@/game/types";
type PracticeTask = TutorialTaskId | "exercise";
const prefix = (seed: number, task: PracticeTask) => `spaceapps:workshop:v2:${seed}:${task}:`;
export const isStage = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 2;
export const bounded = (lo: number, hi: number) => (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
export const integer = (lo: number, hi: number) => (v: unknown): v is number => Number.isInteger(v) && bounded(lo, hi)(v);
export const numbers = (length: number | null, lo: number, hi: number) => (v: unknown): v is number[] => Array.isArray(v) && (length === null ? v.length <= 3 : v.length === length) && v.every(bounded(lo, hi));
export const steps = (length: number, lo: number, hi: number) => (v: unknown): v is number[] => numbers(length, lo, hi)(v) && v.every(Number.isInteger);
export const ids = (allowed: readonly string[]) => (v: unknown): v is string[] => Array.isArray(v) && v.length <= allowed.length && new Set(v).size === v.length && v.every(id => typeof id === "string" && allowed.includes(id));
export const bool = (v: unknown): v is boolean => typeof v === "boolean";
/** Free practice only. Paid outcomes always go through applyAction and replay. */
export function usePractice<T>(seed: number, task: PracticeTask, field: string, initial: T, valid: (value: unknown) => value is T) {
  const key = prefix(seed, task) + field;
  const [value, setValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") return initial;
      const raw = sessionStorage.getItem(key);
      if (!raw || raw.length > 2048) return initial;
      const saved: unknown = JSON.parse(raw);
      return valid(saved) ? saved : initial;
    } catch { return initial; }
  });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional; gameplay remains usable. */ } }, [key, value]);
  return [value, setValue] as const;
}
export function clearPractice(seed: number, task: PracticeTask) {
  try {
    const keys = Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i));
    for (const key of keys) if (key?.startsWith(prefix(seed, task))) sessionStorage.removeItem(key);
  } catch { /* Optional local draft. */ }
}
export function useWorkshopMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const sync = () => { if (root.current) root.current.dataset.paused = String(document.hidden); };
    sync(); document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [root]);
}
