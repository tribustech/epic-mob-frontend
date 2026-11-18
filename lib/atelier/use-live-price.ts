import { useEffect, useState } from "react";
import type { AtelierConfig, AtelierPriceResult } from "./types.ts";

export const PRICE_DEBOUNCE_MS = 400;

/** A response may only be applied if it belongs to the most recent request. */
export function isLatest(requestId: number, latestId: number): boolean {
  return requestId === latestId;
}

interface Settled {
  key: string;
  result: AtelierPriceResult | null;
  unavailable: boolean;
}

let counter = 0;

export function useLivePrice(config: AtelierConfig): {
  result: AtelierPriceResult | null;
  loading: boolean;
  unavailable: boolean;
} {
  const key = JSON.stringify(config);
  const [settled, setSettled] = useState<Settled>({ key: "", result: null, unavailable: false });

  useEffect(() => {
    const requestId = ++counter;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/atelier/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: key,
          signal: controller.signal,
        });
        if (!isLatest(requestId, counter)) return;
        if (res.status === 503) {
          setSettled((s) => ({ key, result: s.result, unavailable: true }));
          return;
        }
        const body = await res.json().catch(() => null);
        if (!isLatest(requestId, counter)) return;
        if (res.ok && body) {
          setSettled({ key, result: body as AtelierPriceResult, unavailable: false });
        } else {
          const errors = Array.isArray(body?.errors) ? body.errors : [];
          setSettled({
            key,
            result: { sellPrice: null, errors, warnings: [], scene: null },
            unavailable: false,
          });
        }
      } catch {
        if (controller.signal.aborted || !isLatest(requestId, counter)) return;
        setSettled((s) => ({ key, result: s.result, unavailable: true }));
      }
    }, PRICE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return { result: settled.result, loading: settled.key !== key, unavailable: settled.unavailable };
}
