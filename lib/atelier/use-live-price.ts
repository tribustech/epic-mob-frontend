import { useCallback, useEffect, useRef, useState } from "react";
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

/** After an outage the price is asked again on its own: 3 s, 8 s, 20 s, then every 30 s (while the tab is visible). */
export const RETRY_DELAYS_MS = [3000, 8000, 20000, 30000] as const;
export function retryDelay(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(Math.max(0, attempt), RETRY_DELAYS_MS.length - 1)];
}

export function useLivePrice(config: AtelierConfig): {
  result: AtelierPriceResult | null;
  loading: boolean;
  unavailable: boolean;
  /** ask again now (the „Reîncearcă" link) */
  retry: () => void;
} {
  const key = JSON.stringify(config);
  const [settled, setSettled] = useState<Settled>({ key: "", result: null, unavailable: false });
  // bumping the nonce asks for the same configuration again
  const [ask, setAsk] = useState<{ nonce: number; manual: boolean }>({ nonce: 0, manual: false });
  const attempts = useRef<{ key: string; n: number }>({ key: "", n: 0 });

  useEffect(() => {
    const requestId = ++counter;
    const controller = new AbortController();
    if (attempts.current.key !== key) attempts.current = { key, n: 0 };
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let onVisible: (() => void) | null = null;
    const down = () => {
      setSettled((s) => ({ key, result: s.result, unavailable: true }));
      setAsk((a) => (a.manual ? { ...a, manual: false } : a));
      const again = () => {
        attempts.current.n += 1;
        setAsk((a) => ({ nonce: a.nonce + 1, manual: false }));
      };
      retryTimer = setTimeout(() => {
        if (document.visibilityState === "visible") return again();
        // a hidden tab asks again as soon as it is looked at
        onVisible = () => {
          if (document.visibilityState === "visible") again();
        };
        document.addEventListener("visibilitychange", onVisible);
      }, retryDelay(attempts.current.n));
    };
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetch("/api/atelier/price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: key,
            signal: controller.signal,
          });
          if (!isLatest(requestId, counter)) return;
          if (res.status === 503) return down();
          const body = await res.json().catch(() => null);
          if (!isLatest(requestId, counter)) return;
          attempts.current.n = 0;
          setAsk((a) => (a.manual ? { ...a, manual: false } : a));
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
          down();
        }
      },
      // a retry has already waited its turn
      ask.nonce > 0 && attempts.current.n > 0 ? 0 : PRICE_DEBOUNCE_MS,
    );
    return () => {
      clearTimeout(timer);
      if (retryTimer) clearTimeout(retryTimer);
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
      controller.abort();
    };
    // `ask.manual` only changes what is shown, never what is asked
  }, [key, ask.nonce]);

  const retry = useCallback(() => {
    attempts.current.n = 0;
    setAsk((a) => ({ nonce: a.nonce + 1, manual: true }));
  }, []);

  return { result: settled.result, loading: settled.key !== key || ask.manual, unavailable: settled.unavailable, retry };
}
