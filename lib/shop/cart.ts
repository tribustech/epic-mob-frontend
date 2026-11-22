"use client";

import { useSyncExternalStore } from "react";
import { MAX_LINES, MAX_QTY } from "./cart-limits";

export { MAX_LINES, MAX_QTY };

/** The shop basket: kept in this browser only (localStorage), sent to us with the order form. */
export interface CartLine {
  slug: string;
  paletteId: string;
  qty: number;
  /** what the client saw when adding it; the order route prices it again */
  name: string;
  colour: string;
  price: number | null;
}

const KEY = "epicmob-cos-v1";
const EVENT = "epicmob-cos";
const EMPTY: CartLine[] = [];

let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.lines;
  let lines: CartLine[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      lines = parsed
        .filter((l) => l && typeof l.slug === "string" && typeof l.paletteId === "string")
        .slice(0, MAX_LINES)
        .map((l) => ({
          slug: l.slug,
          paletteId: l.paletteId,
          qty: Math.min(MAX_QTY, Math.max(1, Math.round(Number(l.qty) || 1))),
          name: String(l.name ?? ""),
          colour: String(l.colour ?? ""),
          price: typeof l.price === "number" ? l.price : null,
        }));
    }
  } catch {
    lines = EMPTY;
  }
  cache = { raw, lines };
  return lines;
}

function write(lines: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode: the basket lives only on this page */
    cache = { raw: JSON.stringify(lines), lines };
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

/** Adds one piece (same product + colour = one more on the same line). false when the basket is full. */
export function addToCart(line: Omit<CartLine, "qty">): boolean {
  const lines = [...read()];
  const i = lines.findIndex((l) => l.slug === line.slug && l.paletteId === line.paletteId);
  if (i >= 0) {
    lines[i] = { ...lines[i], ...line, qty: Math.min(MAX_QTY, lines[i].qty + 1) };
  } else {
    if (lines.length >= MAX_LINES) return false;
    lines.push({ ...line, qty: 1 });
  }
  write(lines);
  return true;
}

export function setQty(slug: string, paletteId: string, qty: number) {
  const lines = read()
    .map((l) => (l.slug === slug && l.paletteId === paletteId ? { ...l, qty: Math.min(MAX_QTY, Math.max(0, qty)) } : l))
    .filter((l) => l.qty > 0);
  write(lines);
}

export function clearCart() {
  write([]);
}
