import { NextResponse } from "next/server";
import { CrmRejectedError, CrmUnavailableError, crmFetch } from "@/lib/atelier/crm";
import type { AtelierConfig, AtelierPriceResult } from "@/lib/atelier/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AtelierConfig | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Configurație invalidă." }, { status: 400 });
  }
  try {
    const result = await crmFetch<AtelierPriceResult>("/api/atelier/price", { method: "POST", body });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CrmRejectedError) {
      return NextResponse.json(error.body ?? { error: "Configurație invalidă." }, { status: error.status });
    }
    if (!(error instanceof CrmUnavailableError)) console.error("Atelier price failed", error);
    return NextResponse.json({ unavailable: true }, { status: 503 });
  }
}
