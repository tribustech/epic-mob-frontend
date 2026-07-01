// Server-only: builds the branded rezumat email HTML from wizard answers.
import {
  contactPreferenceOptions,
  finishOptions,
  labelFor,
  labelsFor,
  lightingOptions,
  materialOptions,
  NU_STIU,
  plansOptions,
  propertyTypes,
  roomOptions,
  spaceStates,
  styleOptions,
  timelineOptions,
  type AnswerOption,
  type QuoteAnswers,
} from "@/lib/quote-wizard";

const CONSULT = "Ne consultam impreuna";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function single(options: AnswerOption[], id: string): string {
  return id && id !== NU_STIU ? labelFor(options, id) || CONSULT : CONSULT;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #EDE4D6;color:#8a7f74;font-size:13px;width:150px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #EDE4D6;color:#2A2420;font-size:15px;">${escapeHtml(value)}</td>
  </tr>`;
}

export function buildQuoteEmailHtml(answers: QuoteAnswers, heading: string, intro: string): string {
  const rows = [
    row("Tip imobil", single(propertyTypes, answers.propertyType)),
    row("Starea spatiului", single(spaceStates, answers.spaceState)),
    row("Camere", labelsFor(roomOptions, answers.rooms) || CONSULT),
    row("Schite / masuratori", single(plansOptions, answers.plansStatus)),
    row("Stil", single(styleOptions, answers.style)),
  ];

  const materials = labelsFor(materialOptions, answers.materials);
  const finishes = labelsFor(finishOptions, answers.finishes);
  const lighting = labelsFor(lightingOptions, answers.lighting);
  if (materials) rows.push(row("Materiale", materials));
  if (finishes) rows.push(row("Finisaje", finishes));
  if (lighting) rows.push(row("Iluminare", lighting));

  rows.push(
    row("Termen", single(timelineOptions, answers.timeline)),
    row("Nume", answers.contact.name),
    row("Telefon", answers.contact.phone),
    row("Email", answers.contact.email),
    row(
      "Preferinta contact",
      labelFor(contactPreferenceOptions, answers.contact.preference) || "oricare",
    ),
  );

  const files =
    answers.files.length > 0
      ? `<p style="margin:24px 0 8px;color:#8a7f74;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Fisiere atasate</p>
         <ul style="margin:0;padding-left:18px;color:#2A2420;font-size:14px;">
           ${answers.files
             .map(
               (file) =>
                 `<li style="margin:4px 0;"><a href="${escapeHtml(file.url)}" style="color:#C06A3E;">${escapeHtml(file.name)}</a></li>`,
             )
             .join("")}
         </ul>`
      : "";

  return `<!DOCTYPE html>
<html lang="ro">
<body style="margin:0;background:#FBF8F3;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F3;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #EDE4D6;">
        <tr><td style="background:#2A2420;padding:28px 32px;">
          <span style="color:#C06A3E;font-size:12px;letter-spacing:3px;text-transform:uppercase;">EpicMob</span>
          <h1 style="margin:10px 0 0;color:#FBF8F3;font-size:24px;">${escapeHtml(heading)}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#8a7f74;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>
          ${files}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#F5F0E8;color:#8a7f74;font-size:12px;">
          Acest email a fost generat automat prin configuratorul EpicMob.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
