// Forwards a FINISHED request (configurator or contact form) to the CRM
// (crm.epicmob.ro), which creates the lead and posts it to the team's Telegram
// group. Intermediate wizard steps never come here: they only go to the Google
// Sheet via /api/track. The CRM ignores a repeated `id`, so retries are safe.
import { buildProjectLines, type QuoteAnswers } from "@/lib/quote-wizard";

export type InquiryOrigin = "configurator" | "contact";

export async function forwardInquiryToCrm(args: {
  id: string | null;
  origin: InquiryOrigin;
  answers: QuoteAnswers;
}): Promise<void> {
  const url = process.env.CRM_INQUIRY_URL;
  const secret = process.env.CRM_INQUIRY_SECRET;
  if (!url || !secret) {
    console.info("CRM inquiry forwarding not configured");
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify({
        id: args.id,
        origin: args.origin,
        contact: args.answers.contact,
        details: args.origin === "configurator" ? buildProjectLines(args.answers) : [],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) console.error("CRM inquiry failed", response.status, await response.text());
  } catch (error) {
    console.error("CRM inquiry failed", error);
  }
}
