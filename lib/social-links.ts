import { business } from "@/lib/business-data";

export type SocialKind = "instagram" | "tiktok" | "facebook";

export type SocialLink = { kind: SocialKind; label: string; href: string };

const KNOWN: { kind: SocialKind; label: string; host: RegExp }[] = [
  { kind: "instagram", label: "Instagram", host: /(^|\.)instagram\.com$/ },
  { kind: "tiktok", label: "TikTok", host: /(^|\.)tiktok\.com$/ },
  { kind: "facebook", label: "Facebook", host: /(^|\.)facebook\.com$/ },
];

/**
 * The brand's social profiles, read from the structured data (`sameAs`) so the
 * footer and the home page never link to a profile the schema does not list.
 * Unknown or malformed URLs are skipped; order follows `sameAs`.
 */
export function socialLinks(sameAs: readonly string[] = business.sameAs): SocialLink[] {
  const out: SocialLink[] = [];
  for (const href of sameAs) {
    let host: string;
    try {
      const url = new URL(href);
      if (url.protocol !== "https:") continue;
      host = url.hostname.toLowerCase();
    } catch {
      continue;
    }
    const match = KNOWN.find((k) => k.host.test(host));
    if (match && !out.some((o) => o.kind === match.kind)) {
      out.push({ kind: match.kind, label: match.label, href });
    }
  }
  return out;
}
