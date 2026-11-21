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
  /** price of one piece, after the offer (whole lei) */
  price: number | null;
  /** usual price of one piece; differs from `price` only while an offer runs */
  regularPrice: number | null;
  offerPercent: number;
  offerLabel: string | null;
}

/** Current prices from the server (/api/magazin/preturi, or the order route's 409 answer). */
export interface FreshPrice {
  slug: string;
  paletteId: string;
  available: boolean;
  name?: string;
  colour?: string;
  price: number | null;
  finalPrice: number | null;
  offerPercent: number;
  offerLabel: string | null;
}

export interface PriceChange {
  slug: string;
  paletteId: string;
  name: string;
  colour: string;
  before: number;
  after: number;
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
          regularPrice: typeof l.regularPrice === "number" ? l.regularPrice : null,
          offerPercent: typeof l.offerPercent === "number" && l.offerPercent > 0 && l.offerPercent < 90 ? l.offerPercent : 0,
          offerLabel: typeof l.offerLabel === "string" && l.offerLabel ? l.offerLabel : null,
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

/** The basket heading: „3 produse" / „2 produse, 3 bucăți" (lines are products, quantities are pieces). */
export function cartSizeText(lineCount: number, pieces: number): string {
  const products = lineCount === 1 ? "1 produs" : `${lineCount} produse`;
  return pieces > lineCount ? `${products}, ${pieces} bucăți` : products;
}

/** What „Adaugă în coș" did: one more piece, nothing (the line already has MAX_QTY pieces), or nothing (the basket is full). */
export type AddResult = "added" | "max" | "full";

/** The basket after adding one piece (same product + colour = one more on the same line); pure, for tests. */
export function addLine(lines: CartLine[], line: Omit<CartLine, "qty">): { lines: CartLine[]; result: AddResult } {
  const i = lines.findIndex((l) => l.slug === line.slug && l.paletteId === line.paletteId);
  if (i >= 0) {
    if (lines[i].qty >= MAX_QTY) return { lines, result: "max" };
    const next = [...lines];
    next[i] = { ...lines[i], ...line, qty: lines[i].qty + 1 };
    return { lines: next, result: "added" };
  }
  if (lines.length >= MAX_LINES) return { lines, result: "full" };
  return { lines: [...lines, { ...line, qty: 1 }], result: "added" };
}

/** Adds one piece to the stored basket. */
export function addToCart(line: Omit<CartLine, "qty">): AddResult {
  const { lines, result } = addLine(read(), line);
  if (result === "added") write(lines);
  return result;
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

/**
 * The basket with today's prices. A line the server could not price now keeps what the client saw (the
 * order route accepts that too); `changed` lists the lines whose price really moved since they were added.
 */
export function mergePrices(lines: CartLine[], fresh: FreshPrice[]): { lines: CartLine[]; changed: PriceChange[] } {
  const changed: PriceChange[] = [];
  const out = lines.map((l) => {
    const f = fresh.find((x) => x.slug === l.slug && x.paletteId === l.paletteId);
    if (!f || !f.available || f.finalPrice == null) return l;
    if (l.price != null && l.price !== f.finalPrice) {
      changed.push({ slug: l.slug, paletteId: l.paletteId, name: f.name ?? l.name, colour: f.colour ?? l.colour, before: l.price, after: f.finalPrice });
    }
    const offerPercent = f.offerPercent > 0 ? f.offerPercent : 0;
    return {
      ...l,
      name: f.name ?? l.name,
      colour: f.colour ?? l.colour,
      price: f.finalPrice,
      regularPrice: offerPercent > 0 ? f.price : null,
      offerPercent,
      offerLabel: offerPercent > 0 ? f.offerLabel : null,
    };
  });
  const same = out.every((l, i) => l === lines[i]) || JSON.stringify(out) === JSON.stringify(lines);
  return { lines: same ? lines : out, changed };
}

/** Writes today's prices into the stored basket; returns the lines whose price moved. */
export function applyFreshPrices(fresh: FreshPrice[]): PriceChange[] {
  const current = read();
  const { lines, changed } = mergePrices(current, fresh);
  if (lines !== current) write(lines);
  return changed;
}
