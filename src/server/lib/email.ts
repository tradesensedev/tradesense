import type { Bindings } from "../env";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Resend. With no RESEND_API_KEY (local dev) the email is printed to the wrangler console instead.
export async function sendEmail(env: Bindings, msg: EmailMessage): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email:dev] To: ${msg.to}\nSubject: ${msg.subject}\n${msg.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM ?? `${env.APP_NAME} <no-reply@example.com>`,
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
}
