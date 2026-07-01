import { NextResponse } from "next/server";
import { buildQuoteSummary, parseQuoteAnswers } from "@/lib/quote-wizard";
import { buildQuoteEmailHtml } from "@/lib/quote-email";
import { isPostmarkConfigured, sendPostmarkEmail } from "@/lib/postmark";
import { contactDetails } from "@/lib/site-data";

export async function POST(request: Request) {
  const payload = await request.json();
  const answers = parseQuoteAnswers(payload);

  if (!answers) {
    return NextResponse.json({ error: "Datele de contact sunt incomplete." }, { status: 400 });
  }

  const summary = buildQuoteSummary(answers);

  // Optional legacy webhook (kept for backward compatibility).
  const webhookUrl = process.env.QUOTE_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submission: answers, summary, sentAt: new Date().toISOString() }),
      });
    } catch (webhookError) {
      console.error("Quote webhook failed", webhookError);
    }
  }

  // Email both the client and the business via Postmark.
  let emailed = false;
  const toEmail = process.env.QUOTE_TO_EMAIL;

  if (isPostmarkConfigured()) {
    // Notify the business (always).
    try {
      await sendPostmarkEmail({
        to: toEmail || contactDetails.email,
        replyTo: answers.contact.email || undefined,
        subject: `Cerere noua — ${answers.contact.name}`,
        html: buildQuoteEmailHtml(
          answers,
          "Cerere noua de oferta",
          `${answers.contact.name} a trimis o cerere prin configurator.`,
        ),
      });
    } catch (emailError) {
      console.error("Business quote email failed", emailError);
    }

    // Confirm to the client only if they gave an email.
    if (answers.contact.email) {
      try {
        await sendPostmarkEmail({
          to: answers.contact.email,
          subject: "Am primit cererea ta — EpicMob",
          html: buildQuoteEmailHtml(
            answers,
            "Multumim pentru cerere!",
            "Am primit detaliile de mai jos si revenim in cel mai scurt timp. Iata rezumatul proiectului tau.",
          ),
        });
        emailed = true;
      } catch (emailError) {
        console.error("Client quote email failed", emailError);
      }
    }
  } else {
    console.info("Quote request received (email not configured)", summary);
  }

  const params = new URLSearchParams({
    text: `Buna! Tocmai v-am trimis o cerere pe site. Sunt ${answers.contact.name}.`,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    whatsAppUrl: `${contactDetails.whatsapp}?${params.toString()}`,
  });
}
