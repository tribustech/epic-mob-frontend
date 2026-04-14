import { NextResponse } from "next/server";
import { buildProjectSummary, parseConfiguratorSubmission } from "@/lib/configurator";
import { contactDetails } from "@/lib/site-data";

export async function POST(request: Request) {
  const payload = await request.json();
  const submission = parseConfiguratorSubmission(payload);

  if (!submission) {
    return NextResponse.json(
      { error: "Datele trimise nu sunt complete." },
      { status: 400 },
    );
  }

  const summary = buildProjectSummary(submission);
  const delivery = {
    mode: "preview-only" as const,
  };

  const webhookUrl = process.env.QUOTE_WEBHOOK_URL;

  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submission,
        summary,
        sentAt: new Date().toISOString(),
      }),
    });
  } else {
    console.info("Quote request received", submission);
  }

  const params = new URLSearchParams({
    text: `Buna! Tocmai am trimis cererea prin configurator.${submission.fullName ? ` Sunt ${submission.fullName}.` : ""}`,
  });

  return NextResponse.json({
    ok: true,
    summary,
    delivery,
    whatsAppUrl: `${contactDetails.whatsapp}?${params.toString()}`,
  });
}
