import type { AtelierCatalog } from "./types";

export class CrmUnavailableError extends Error {
  constructor(message = "CRM unavailable") {
    super(message);
    this.name = "CrmUnavailableError";
  }
}

/** Non-retryable CRM answer (4xx other than auth), e.g. 400 or 422 with a JSON body. */
export class CrmRejectedError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`CRM rejected request (${status})`);
    this.name = "CrmRejectedError";
  }
}

type CrmPath = "/api/atelier/catalog" | "/api/atelier/price" | "/api/atelier/lead" | "/api/atelier/event";

export async function crmFetch<T>(
  path: CrmPath,
  init: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number; revalidate?: number } = {},
): Promise<T> {
  const base = process.env.CRM_API_URL;
  const key = process.env.ATELIER_API_KEY;
  if (!base || !key) throw new CrmUnavailableError("CRM_API_URL / ATELIER_API_KEY not configured");

  const method = init.method ?? "GET";
  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
      method,
      headers: {
        "x-atelier-key": key,
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify(init.body ?? {}) : undefined,
      signal: AbortSignal.timeout(init.timeoutMs ?? 8000),
      ...(method === "GET" && init.revalidate != null
        ? { next: { revalidate: init.revalidate } }
        : { cache: "no-store" as const }),
    });
  } catch (error) {
    throw new CrmUnavailableError(error instanceof Error ? error.message : "network error");
  }

  // 5xx and auth failures are our/CRM's problem, not the customer's.
  if (res.status >= 500 || res.status === 401 || res.status === 403) {
    throw new CrmUnavailableError(`CRM responded ${res.status}`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new CrmRejectedError(res.status, body);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new CrmUnavailableError("CRM returned invalid JSON");
  }
}

export async function getAtelierCatalog(): Promise<AtelierCatalog | null> {
  try {
    return await crmFetch<AtelierCatalog>("/api/atelier/catalog", { revalidate: 600 });
  } catch (error) {
    console.error("Atelier catalog fetch failed", error);
    return null;
  }
}
