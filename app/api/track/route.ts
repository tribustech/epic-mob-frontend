import { NextResponse } from "next/server";

// Receives full quote-wizard records (draft + submitted) and appends them to a
// Google Sheet via its webhook. Falls back to server logs if unconfigured.
export async function POST(request: Request) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const webhookUrl =
    process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.ANALYTICS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Sheet webhook failed", error);
    }
  } else {
    console.info("[wizard-record]", JSON.stringify(payload));
  }

  return new NextResponse(null, { status: 204 });
}
