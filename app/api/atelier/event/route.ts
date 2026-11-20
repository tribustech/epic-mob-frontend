import { after } from "next/server";
import { crmFetch } from "@/lib/atelier/crm";
import { createRateLimiter, isSameHost, isSameOriginRequest, parseFunnelBody } from "@/lib/atelier/funnel-payload";

// Anonymous configurator funnel events: browser → here → CRM. Always answers 204 right away;
// the CRM call happens after the response, so a slow or dead CRM never touches the visitor.
// Nothing personal is added: no IP, no user agent — only the country Vercel already resolved.

const MAX_BODY_BYTES = 8_000;
// a real visit sends a few dozen events; this only stops a runaway loop or a script
const limited = createRateLimiter(120, 60_000);
// the session id is chosen by the caller, so the real abuse limit is per client address.
// The address is only a key in this in-memory map: it is never stored or sent to the CRM.
const limitedByIp = createRateLimiter(300, 60_000);
let warned = false;

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  const host = request.headers.get("host");
  const sameOrigin = isSameOriginRequest(
    { origin: request.headers.get("origin"), secFetchSite: request.headers.get("sec-fetch-site"), host },
    process.env.NODE_ENV === "production",
  );
  if (!sameOrigin || limitedByIp(clientIp(request))) return noContent();

  let raw: unknown = null;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return noContent();
    raw = JSON.parse(text);
  } catch {
    return noContent();
  }

  const payload = parseFunnelBody(raw);
  if (!payload || limited(payload.sessionId)) return noContent();

  // coming from another page of this site is not a traffic source
  if (isSameHost(payload.referrer, host)) delete payload.referrer;

  const header = request.headers.get("x-vercel-ip-country");
  const country = header && /^[A-Za-z]{2}$/.test(header) ? header.toUpperCase() : null;

  after(async () => {
    try {
      await crmFetch("/api/atelier/event", { method: "POST", body: { ...payload, country }, timeoutMs: 4000 });
    } catch (error) {
      // e.g. the CRM does not have the endpoint yet: say it once per server instance, not per event
      if (!warned) {
        warned = true;
        console.warn("Atelier events are not reaching the CRM:", error instanceof Error ? error.message : error);
      }
    }
  });
  return noContent();
}
