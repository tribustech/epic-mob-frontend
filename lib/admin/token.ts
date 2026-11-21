import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The admin token the CRM issues at /atelier/site-login (lib/atelier/admin-token.ts there): a JWT HS256
 * signed with ATELIER_ADMIN_SECRET, issuer crm.epicmob.ro, audience epicmob-site-admin, 12 hours.
 * Checked here with node:crypto only (no extra dependency). The site keeps it in an httpOnly cookie and
 * sends it back to the CRM with every breakdown request; the CRM checks it again (and the user's role).
 */

export const ADMIN_TOKEN_ISSUER = "crm.epicmob.ro";
export const ADMIN_TOKEN_AUDIENCE = "epicmob-site-admin";
const MIN_SECRET_LENGTH = 32;

export interface AdminClaims {
  userId: string;
  name: string;
  /** epoch seconds */
  exp: number;
}

export function adminSecret(env: Record<string, string | undefined> = process.env): string | null {
  const s = env.ATELIER_ADMIN_SECRET ?? "";
  return s.length >= MIN_SECRET_LENGTH ? s : null;
}

const json = (part: string): Record<string, unknown> | null => {
  try {
    const v = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};

/** The claims of a valid token, or null (bad shape, signature, issuer, audience, or expired). */
export function verifyAdminToken(token: unknown, secret: string | null, nowSec = Math.floor(Date.now() / 1000)): AdminClaims | null {
  if (!secret || typeof token !== "string" || token.length > 2000) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || !parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p))) return null;
  const [h, p, s] = parts;
  const header = json(h);
  if (!header || header.alg !== "HS256") return null;
  const expected = createHmac("sha256", secret).update(`${h}.${p}`).digest();
  const given = Buffer.from(s, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const c = json(p);
  if (!c || c.iss !== ADMIN_TOKEN_ISSUER) return null;
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!aud.includes(ADMIN_TOKEN_AUDIENCE)) return null;
  if (typeof c.sub !== "string" || !c.sub || typeof c.exp !== "number" || c.exp <= nowSec) return null;
  if (typeof c.iat === "number" && c.iat > nowSec + 60) return null;
  return { userId: c.sub, name: typeof c.name === "string" ? c.name : "Admin", exp: c.exp };
}
