import { CrmRejectedError, crmFetch } from "@/lib/atelier/crm";
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
  const send1 = async (chunk: typeof send): Promise<void> => {
    try {
      const res = await crmFetch<{ items: PriceBreakdown[] }>("/api/atelier/breakdown", {
        method: "POST",
        body: chunk.map((c) => c.body),
        headers: { "x-atelier-admin": token },
        timeoutMs: 25_000,
      });
      chunk.forEach((c, j) => (out[c.i] = res.items[j]));
    } catch (error) {
      // The CRM checks the whole batch, so one line it does not accept fails all of them. Mark the lines it
      // named (or, when it names none, split the batch in two and ask again) so the other lines still get
      // their breakdown. Login, timeout and 5xx errors still fail the whole call.
      if (!(error instanceof CrmRejectedError)) throw error;
      const fail = (c: (typeof send)[number]) =>
        (out[c.i] = { key: lines[c.i].key, ok: false, sellPrice: null, totals: null, problems: crmIssues(error.body, chunk.indexOf(c)) });
      if (chunk.length === 1) {
        fail(chunk[0]);
        return;
      }
      const bad = new Set(badItems(error.body).filter((j) => j < chunk.length));
      if (bad.size > 0 && bad.size < chunk.length) {
        chunk.filter((_, j) => bad.has(j)).forEach(fail);
        await send1(chunk.filter((_, j) => !bad.has(j)));
        return;
      }
      const half = Math.ceil(chunk.length / 2);
      await Promise.all([send1(chunk.slice(0, half)), send1(chunk.slice(half))]);
    }
  };
  await Promise.all(chunks.map((chunk) => send1(chunk)));
  return out;
}

type CrmIssue = { message?: unknown; path?: unknown };

function issuesOf(body: unknown): { error?: unknown; list: unknown[] } {
  const o = (body && typeof body === "object" ? body : {}) as { error?: unknown; issues?: unknown; errors?: unknown };
  return { error: o.error, list: [o.issues, o.errors].flatMap((x) => (Array.isArray(x) ? x : [])) };
}

/** Issue path → its segments: „3.config.columns" or ["3", "config"] → ["3", "config", …]. */
function pathOf(x: unknown): string[] {
  const p = x && typeof x === "object" ? (x as CrmIssue).path : undefined;
  if (Array.isArray(p)) return p.map(String);
  return typeof p === "string" && p ? p.split(".") : [];
}

/** Batch positions the CRM's validation named (the first path segment of each issue). */
export function badItems(body: unknown): number[] {
  return [...new Set(issuesOf(body).list.map((x) => pathOf(x)[0]).filter((s) => s != null && /^\d+$/.test(s)).map(Number))];
}

/**
 * Readable messages from a CRM 4xx body ({ error, issues: [{ message, path }] } or { errors: [{ message }] }).
 * With `index`, only the issues about that batch position (plus the ones about no position).
 */
export function crmIssues(body: unknown, index?: number): string[] {
  const { error, list } = issuesOf(body);
  const messages = list
    .filter((x) => {
      const first = pathOf(x)[0];
      return index == null || first == null || !/^\d+$/.test(first) || Number(first) === index;
    })
    .map((x) => {
      if (typeof x === "string") return x;
      const m = (x && typeof x === "object" ? x : {}) as CrmIssue;
      if (typeof m.message !== "string") return null;
      const path = pathOf(x);
      const rest = index != null && /^\d+$/.test(path[0] ?? "") ? path.slice(1) : path;
      return rest.length ? `${rest.join(".")}: ${m.message}` : m.message;
    })
    .filter((m): m is string => !!m)
    .slice(0, 5);
  if (messages.length) return ["CRM-ul a respins configurația:", ...messages];
  return [typeof error === "string" && error ? `CRM-ul a respins configurația (${error}).` : "CRM-ul a respins configurația."];
}
