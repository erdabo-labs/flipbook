"use client";

import { useCallback, useMemo, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";

const memory = new Map<string, string>();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const serverSnapshot = () => null;

function read(key: string) {
  if (memory.has(key)) return memory.get(key)!;
  try { return sessionStorage.getItem(key); } catch { return null; }
}

// Session-scoped drafts survive navigation/reloads without retaining private data after the tab closes.
// The in-memory copy also works when browser storage is unavailable.
export function useDraft<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>, () => void] {
  const storageKey = `flipbook:draft:v1:${key}`;
  const initialJson = JSON.stringify(typeof initial === "function" ? (initial as () => T)() : initial);
  const getSnapshot = useCallback(() => read(storageKey), [storageKey]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const decode = useCallback((saved: string | null): T => {
    const fallback = JSON.parse(initialJson);
    if (saved === null) return fallback;
    try {
      const parsed = JSON.parse(saved);
      // Reject malformed or incompatible drafts instead of breaking a form.
      const compatible = (value: unknown, example: unknown): boolean => {
        if (example === null) return value === null || typeof value === "number";
        if (Array.isArray(example)) return Array.isArray(value) && (example.length === 0 || value.every(item => compatible(item, example[0])));
        if (typeof example === "object") return value !== null && typeof value === "object" && Object.entries(example).every(([field, sample]) => compatible((value as Record<string, unknown>)[field], sample));
        return typeof value === typeof example;
      };
      return compatible(parsed, fallback) ? parsed : fallback;
    } catch { return fallback; }
  }, [initialJson]);
  const value = useMemo(() => decode(raw), [raw, decode]);
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const current = decode(read(storageKey));
    const updated = typeof next === "function" ? (next as (previous: T) => T)(current) : next;
    const json = JSON.stringify(updated);
    memory.set(storageKey, json);
    try { sessionStorage.setItem(storageKey, json); } catch { /* Storage is optional. */ }
    listeners.forEach(listener => listener());
  }, [storageKey, decode]);
  const clear = useCallback(() => {
    memory.delete(storageKey);
    try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
    listeners.forEach(listener => listener());
  }, [storageKey]);
  return [value, setValue, clear];
}
