"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { Medicine } from "./types/medicine";
export interface BookEntry { medicine: Medicine; saved: boolean; favorite: boolean; updatedAt: string }
interface Book { entries: BookEntry[]; recent: string[]; viewed: Medicine[] }
const KEY = "yakmi:library:v1";
const EMPTY = '{"entries":[],"recent":[],"viewed":[]}';
const EVENT = "yakmi:library-change";
function snapshot() { try { return localStorage.getItem(KEY) ?? EMPTY; } catch { return EMPTY; } }
function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener(EVENT, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENT, callback); }; }
function isMedicine(item: unknown): item is Medicine {
  if (!item || typeof item !== "object") return false;
  const value = item as Medicine;
  return typeof value.id === "string" && /^\d{9}$/.test(value.id) && typeof value.name === "string" && typeof value.manufacturer === "string" && ["easy", "permit", "identification"].includes(value.source);
}
function readBook(raw: string): Book {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return { entries: [], recent: [], viewed: [] };
    const entries: BookEntry[] = Array.isArray(data.entries) ? data.entries.filter((e: BookEntry) => e && isMedicine(e.medicine) && typeof e.saved === "boolean" && typeof e.favorite === "boolean").slice(0, 500) : [];
    return { entries, recent: Array.isArray(data.recent) ? data.recent.filter((s: unknown) => typeof s === "string" && s.length <= 100).slice(0, 20) : [], viewed: Array.isArray(data.viewed) ? data.viewed.filter(isMedicine).slice(0, 30) : [] };
  } catch { return { entries: [], recent: [], viewed: [] }; }
}
function write(update: (book: Book) => Book): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(update(readBook(snapshot())))); window.dispatchEvent(new Event(EVENT)); return true; } catch { return false; }
}
export function useLibrary() { const raw = useSyncExternalStore(subscribe, snapshot, () => EMPTY); return useMemo(() => readBook(raw), [raw]); }
export function toggleMedicine(medicine: Medicine, field: "saved" | "favorite") {
  return write((book) => {
    const current = book.entries.find((entry) => entry.medicine.id === medicine.id);
    const entry: BookEntry = { medicine, saved: current?.saved ?? false, favorite: current?.favorite ?? false, updatedAt: new Date().toISOString() };
    entry[field] = !entry[field];
    return { ...book, entries: [entry, ...book.entries.filter((e) => e.medicine.id !== medicine.id)].filter((e) => e.saved || e.favorite).slice(0, 500) };
  });
}
export function removeMedicine(id: string) { return write((book) => ({ ...book, entries: book.entries.filter((e) => e.medicine.id !== id) })); }
export function recordSearch(query: string) { return write((book) => ({ ...book, recent: [query, ...book.recent.filter((value) => value !== query)].slice(0, 20) })); }
export function clearRecent() { return write((book) => ({ ...book, recent: [] })); }
export function recordViewed(medicine: Medicine) { return write((book) => ({ ...book, viewed: [medicine, ...book.viewed.filter((item) => item.id !== medicine.id)].slice(0, 30) })); }
