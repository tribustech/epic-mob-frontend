import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildQuoteSummary, parseQuoteAnswers } from "@/lib/quote-wizard";
import { buildQuoteEmailHtml } from "@/lib/quote-email";
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

  // Email both the client and the business via Resend.
  let emailed = false;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.QUOTE_FROM_EMAIL;
  const toEmail = process.env.QUOTE_TO_EMAIL;

  if (apiKey && fromEmail) {
    const resend = new Resend(apiKey);

    // Notify the business (always).
    try {
      await resend.emails.send({
        from: fromEmail,
        to: toEmail || contactDetails.email,
        ...(answers.contact.email ? { replyTo: answers.contact.email } : {}),
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
        await resend.emails.send({
          from: fromEmail,
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
    text: `Buna! Tocmai am trimis cererea prin configurator. Sunt ${answers.contact.name}.`,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    whatsAppUrl: `${contactDetails.whatsapp}?${params.toString()}`,
  });
}
