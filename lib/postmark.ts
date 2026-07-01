// Minimal Postmark transactional email sender (no SDK — plain REST).
// Configure POSTMARK_SERVER_TOKEN + QUOTE_FROM_EMAIL (a verified sender signature).

type PostmarkEmail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export function isPostmarkConfigured(): boolean {
  return Boolean(process.env.POSTMARK_SERVER_TOKEN && process.env.QUOTE_FROM_EMAIL);
}

export async function sendPostmarkEmail({ to, subject, html, replyTo }: PostmarkEmail): Promise<void> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (!token || !from) throw new Error("Postmark not configured");

  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: html,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM || "outbound",
      ...(replyTo ? { ReplyTo: replyTo } : {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    ErrorCode?: number;
    Message?: string;
  };

  if (!response.ok || (typeof data.ErrorCode === "number" && data.ErrorCode !== 0)) {
    throw new Error(`Postmark ${data.ErrorCode ?? response.status}: ${data.Message ?? "send failed"}`);
  }
}
