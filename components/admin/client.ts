"use client";

import { useEffect, useState } from "react";
import type { BreakdownRequest, PriceBreakdown } from "@/lib/admin/breakdown";

/**
 * Admin panels load only when the readable flag cookie (set with the httpOnly session) is there, so a normal
 * visitor never calls the admin API. The API itself checks the real, httpOnly cookie.
 */
export function useIsAdmin(): boolean {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    // read after mount: the server render (and the static pages) never know about the admin
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdmin(document.cookie.split(";").some((c) => c.trim() === "epicmob_admin_ui=1"));
  }, []);
  return admin;
}

/** Calls the admin API; one call for many lines. */
export async function postBreakdowns(items: BreakdownRequest[]): Promise<PriceBreakdown[]> {
  const res = await fetch("/api/admin/defalcare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(body?.items)) throw new Error(body?.error ?? `Eroare ${res.status}`);
  return body.items as PriceBreakdown[];
}

/* ── many small requests (one per product card) → a few batched calls ── */

type Waiting = { req: BreakdownRequest; resolve: (b: PriceBreakdown) => void; reject: (e: unknown) => void };
let queue: Waiting[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
const cache = new Map<string, Promise<PriceBreakdown>>();

function flush() {
  timer = null;
  const batch = queue;
  queue = [];
  for (let i = 0; i < batch.length; i += 60) {
    const part = batch.slice(i, i + 60);
    postBreakdowns(part.map((w) => w.req)).then(
      (items) => part.forEach((w, j) => w.resolve(items[j])),
      (e) => part.forEach((w) => w.reject(e)),
    );
  }
}

/** One breakdown, batched with the others asked in the same moment; cached for the page's life. */
export function queueBreakdown(req: BreakdownRequest): Promise<PriceBreakdown> {
  const id = JSON.stringify([req.config ?? null, req.share ?? null, req.offerPercent ?? null]);
  const hit = cache.get(id);
  if (hit) return hit;
  const p = new Promise<PriceBreakdown>((resolve, reject) => {
    queue.push({ req, resolve, reject });
    if (!timer) timer = setTimeout(flush, 40);
  });
  p.catch(() => cache.delete(id));
  cache.set(id, p);
  return p;
}
