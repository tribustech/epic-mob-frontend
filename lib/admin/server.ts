import { crmFetch } from "@/lib/atelier/crm";
import { decodeShare } from "@/lib/atelier/share";
import type { AtelierCatalog } from "@/lib/atelier/types";
import type { BreakdownRequest, PriceBreakdown } from "./breakdown";

/** The CRM takes at most 60 configurations per call (app/api/atelier/breakdown there). */
const CRM_BATCH = 60;

/**
 * Breakdowns from the CRM for these lines, in order. `share` codes are decoded with the same decoder as
 * the configurator. `token` is the admin's CRM token (the CRM checks it again, plus the API key).
 */
export async function fetchBreakdowns(lines: BreakdownRequest[], token: string, catalog: AtelierCatalog | null): Promise<PriceBreakdown[]> {
  const out: PriceBreakdown[] = new Array(lines.length);
  const send: { i: number; body: { key: string; config: unknown; offerPercent: number | null } }[] = [];
  lines.forEach((l, i) => {
    const config = l.config ?? (l.share && catalog ? decodeShare(l.share, catalog) : null);
    if (!config) {
      out[i] = { key: l.key, ok: false, sellPrice: null, totals: null, problems: ["Linkul nu e o configurație validă (sau catalogul CRM nu răspunde)."] };
      return;
    }
    send.push({ i, body: { key: l.key, config, offerPercent: l.offerPercent ?? null } });
  });
  const chunks: (typeof send)[] = [];
  for (let k = 0; k < send.length; k += CRM_BATCH) chunks.push(send.slice(k, k + CRM_BATCH));
  await Promise.all(
    chunks.map(async (chunk) => {
      const res = await crmFetch<{ items: PriceBreakdown[] }>("/api/atelier/breakdown", {
        method: "POST",
        body: chunk.map((c) => c.body),
        headers: { "x-atelier-admin": token },
        timeoutMs: 25_000,
      });
      chunk.forEach((c, j) => (out[c.i] = res.items[j]));
    }),
  );
  return out;
}
