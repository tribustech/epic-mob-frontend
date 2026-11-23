"use client";

import { useEffect, useMemo, useState } from "react";
import { followUps } from "@/lib/atelier/house-rules";
import { atelierReducer } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig, AtelierFronts, FrontKind } from "@/lib/atelier/types";

/** Wait this long after the last change before pricing the other materials (the main price goes first). */
const MATERIAL_PRICE_DELAY_MS = 450;

/** A price per configuration, kept for the visit: going back to a configuration shows its prices at once. */
type Priced = number | null;
const cache = new Map<string, Priced>();
/** configurations that could not be priced because the service was down: shown as „—", asked again later */
const down = new Map<string, number>();
const DOWN_RETRY_MS = 30_000;
const known = (body: string) => cache.has(body) || Date.now() - (down.get(body) ?? -Infinity) < DOWN_RETRY_MS;
const CACHE_LIMIT = 200;

/**
 * The configuration as it would be with these fronts, settled by the same house rules a tap runs (a handle
 * cut into the door goes back to the usual one on PAL / AGT), so the price shown is the price the client gets.
 */
export function withFronts(config: AtelierConfig, fronts: AtelierFronts, catalog: AtelierCatalog): AtelierConfig {
  const next = atelierReducer(config, { type: "setFronts", fronts });
  return followUps(config, next, catalog).actions.reduce(atelierReducer, next);
}

export type MaterialPrice = { state: "loading" } | { state: "ready"; price: number } | { state: "none" };

/**
 * The price of the current configuration in each front material (`fronts` holds the fronts each material
 * would get). Asked in the background, a little after the last change, never more than once per
 * configuration; a newer configuration cancels the requests of the older one.
 */
export function useMaterialPrices(
  config: AtelierConfig,
  catalog: AtelierCatalog,
  fronts: Partial<Record<FrontKind, AtelierFronts>>,
): Partial<Record<FrontKind, MaterialPrice>> {
  const bodies = useMemo(() => {
    const out: [FrontKind, string][] = [];
    for (const [kind, f] of Object.entries(fronts) as [FrontKind, AtelierFronts][]) out.push([kind, JSON.stringify(withFronts(config, f, catalog))]);
    return out;
  }, [config, catalog, fronts]);
  const signature = bodies.map(([, b]) => b).join("\n");
  // bumped when a request settles, so the cache is read again
  const [, setTick] = useState(0);

  useEffect(() => {
    const missing = bodies.filter(([, body]) => !known(body));
    if (missing.length === 0) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      for (const [, body] of missing) {
        fetch("/api/atelier/price", { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: controller.signal })
          .then(async (res) => {
            // an outage is remembered only for a while: the same configuration is asked again later
            if (res.status === 503) {
              down.set(body, Date.now());
              if (!controller.signal.aborted) setTick((t) => t + 1);
              return;
            }
            const data = (await res.json().catch(() => null)) as { sellPrice?: number | null; errors?: unknown[] } | null;
            const ok = res.ok && data && typeof data.sellPrice === "number" && !(Array.isArray(data.errors) && data.errors.length > 0);
            if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
            cache.set(body, ok ? (data.sellPrice as number) : null);
            if (!controller.signal.aborted) setTick((t) => t + 1);
          })
          .catch(() => {
            if (controller.signal.aborted) return;
            down.set(body, Date.now());
            setTick((t) => t + 1);
          });
      }
    }, MATERIAL_PRICE_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // the signature stands for the bodies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const out: Partial<Record<FrontKind, MaterialPrice>> = {};
  for (const [kind, body] of bodies) {
    const hit = cache.get(body);
    out[kind] = hit === undefined ? (known(body) ? { state: "none" } : { state: "loading" }) : hit === null ? { state: "none" } : { state: "ready", price: hit };
  }
  return out;
}
