import { NextResponse } from "next/server";
import { CrmUnavailableError } from "@/lib/atelier/crm";
import { fetchBreakdowns } from "@/lib/admin/server";
import { currentAdmin } from "@/lib/admin/session";
import type { BreakdownRequest } from "@/lib/admin/breakdown";
import { getShopCatalog } from "@/lib/shop/server";

const MAX_LINES = 240;

/**
 * Admin only (httpOnly cookie with a valid CRM token): price breakdowns from the CRM for the configurations
 * on screen. Body: { items: [{ key, config | share, offerPercent? }] }. Costs never reach a normal visitor.
 */
export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { items?: unknown } | null;
  const raw = Array.isArray(body?.items) ? body.items : null;
  if (!raw || raw.length === 0 || raw.length > MAX_LINES) return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  const lines: BreakdownRequest[] = raw.map((x, i) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    return {
      key: typeof o.key === "string" ? o.key.slice(0, 200) : String(i),
      config: o.config && typeof o.config === "object" ? o.config : undefined,
      share: typeof o.share === "string" ? o.share : undefined,
      offerPercent: typeof o.offerPercent === "number" ? o.offerPercent : null,
    };
  });
  try {
    const catalog = lines.some((l) => !l.config) ? await getShopCatalog() : null;
    const items = await fetchBreakdowns(lines, admin.token, catalog);
    return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Admin breakdown failed", message);
    // only 401/403 mean the login; a timeout or a CRM error is not fixed by logging in again
    const login = error instanceof CrmUnavailableError && /CRM responded 40[13]\b/.test(message);
    return NextResponse.json(
      { error: login ? "CRM-ul nu ți-a acceptat login-ul (ieși și intră din nou)." : "CRM-ul nu răspunde acum (sau a dat o eroare). Încearcă din nou peste un minut." },
      { status: login ? 401 : 503 },
    );
  }
}
