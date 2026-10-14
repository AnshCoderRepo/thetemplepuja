// Server-side Email notification service for templepujasewa
// Delivers messages directly to the CEO / Leadership inbox.
// Never import this file from a client component.

import nodemailer from "nodemailer";
import { SITE_CONFIG } from "./config";

export interface CeoEmailPayload {
  id: string;
  name: string;
  contact: string;
  subject?: string;
  message: string;
  createdAt?: string;
}

export interface EmailSendResult {
  ok: boolean;
  provider: "smtp" | "resend" | "dev-logger";
  to: string;
  messageId?: string;
  error?: string;
}

/**
 * Returns the destination email address for CEO communications.
 * Configured via CEO_EMAIL, CEO_NOTIFICATION_EMAIL, or ADMIN_EMAIL.
 */
export function getCeoDestinationEmail(): string {
  return (
    process.env.CEO_EMAIL ||
    process.env.CEO_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    SITE_CONFIG.contact.email
  );
}

/**
 * Extract an email address from the devotee's contact field if present.
 */
export function extractDevoteeEmail(contact: string): string | null {
  const match = contact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

/**
 * Extract phone digits if present in contact field.
 */
export function extractDevoteePhone(contact: string): string | null {
  const digits = contact.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

/**
 * Format human-readable date & time in Indian Standard Time (IST).
 */
export function formatIstDate(dateString?: string): string {
  try {
    const d = dateString ? new Date(dateString) : new Date();
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    });
  } catch {
    return new Date().toLocaleString("en-IN");
  }
}

/**
 * Formats a clean, high-contrast plain text email for email clients that do not render HTML.
 */
export function formatCeoEmailText(payload: CeoEmailPayload): string {
  const istTime = formatIstDate(payload.createdAt);
  const devoteePhone = extractDevoteePhone(payload.contact);
  const devoteeEmail = extractDevoteeEmail(payload.contact);

  const lines = [
    `=============================================================`,
    `       NEW DEVOTEE FEEDBACK — A MESSAGE TO OUR CEO          `,
    `                  templepujasewa                             `,
    `=============================================================`,
    ``,
    `Submission ID : ${payload.id}`,
    `Submitted On  : ${istTime}`,
    ``,
    `---------------- DEVOTEE DETAILS ----------------------------`,
    `Name          : ${payload.name}`,
    `Contact       : ${payload.contact}`,
    payload.subject ? `Subject       : ${payload.subject}` : `Subject       : Direct Message to CEO`,
    ``,
    `---------------- MESSAGE CONTENT ----------------------------`,
    payload.message,
    ``,
    `---------------- QUICK RESPONSE OPTIONS ---------------------`,
    devoteePhone ? `• WhatsApp Chat : https://wa.me/91${devoteePhone}` : null,
    devoteePhone ? `• Direct Call   : tel:+91${devoteePhone}` : null,
    devoteeEmail ? `• Direct Email  : mailto:${devoteeEmail}` : null,
    ``,
    `-------------------------------------------------------------`,
    `You can also view and manage this message in the Admin Portal:`,
    `${SITE_CONFIG.siteUrl}/admin`,
    `=============================================================`,
  ];

  return lines.filter((l) => l !== null).join("\n");
}

/**
 * Formats a luxury, responsive HTML email with saffron temple aesthetics,
 * clear metadata cards, message blockquote, and one-click response buttons.
 */
export function formatCeoEmailHtml(payload: CeoEmailPayload): string {
  const istTime = formatIstDate(payload.createdAt);
  const devoteePhone = extractDevoteePhone(payload.contact);
  const devoteeEmail = extractDevoteeEmail(payload.contact);
  const subjectDisplay = payload.subject || "Direct Message to CEO";

  // Quick action buttons
  let actionButtonsHtml = "";
  if (devoteePhone) {
    actionButtonsHtml += `
      <a href="https://wa.me/91${devoteePhone}" style="display:inline-block;padding:10px 18px;margin-right:8px;margin-bottom:8px;background-color:#25D366;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px;">
        💬 Reply on WhatsApp
      </a>
      <a href="tel:+91${devoteePhone}" style="display:inline-block;padding:10px 18px;margin-right:8px;margin-bottom:8px;background-color:#1e293b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px;">
        📞 Call Devotee
      </a>
    `;
  }
  if (devoteeEmail) {
    actionButtonsHtml += `
      <a href="mailto:${devoteeEmail}" style="display:inline-block;padding:10px 18px;margin-right:8px;margin-bottom:8px;background-color:#d97706;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px;">
        ✉️ Reply via Email
      </a>
    `;
  }

  // Safe escape message for HTML
  const escapedMessage = payload.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Message to the CEO</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:620px;background-color:#ffffff;border-radius:16px;border:1px solid #fde68a;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);overflow:hidden;">
          
          <!-- Saffron Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%);padding:28px 24px;text-align:center;color:#ffffff;">
              <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#fef3c7;margin-bottom:6px;">
                Direct Leadership Desk
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                📩 New Message to Our CEO
              </h1>
              <div style="margin-top:6px;font-size:13px;color:#fef3c7;opacity:0.95;">
                templepujasewa • Official Devotee Feedback
              </div>
            </td>
          </tr>

          <!-- Summary Strip -->
          <tr>
            <td style="background-color:#fffbeb;border-bottom:1px solid #fef3c7;padding:12px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:12px;color:#92400e;font-weight:600;">
                    Tracking ID: <span style="font-family:monospace;background-color:#fef3c7;padding:2px 6px;border-radius:4px;color:#78350f;">${payload.id}</span>
                  </td>
                  <td align="right" style="font-size:12px;color:#92400e;">
                    ${istTime}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:28px 24px;">
              
              <!-- Devotee Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;margin-bottom:10px;">
                      Devotee Information
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="4">
                      <tr>
                        <td width="90" style="font-size:13px;color:#64748b;font-weight:600;">Name:</td>
                        <td style="font-size:14px;color:#0f172a;font-weight:700;">${payload.name}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;font-weight:600;">Contact:</td>
                        <td style="font-size:14px;color:#0f172a;font-weight:700;">${payload.contact}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;font-weight:600;">Subject:</td>
                        <td style="font-size:14px;color:#0f172a;font-weight:700;">${subjectDisplay}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Message Content Box -->
              <div style="margin-bottom:24px;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#b45309;margin-bottom:8px;">
                  Devotee Message:
                </div>
                <div style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 12px 12px 0;padding:18px 20px;font-size:14px;line-height:1.7;color:#1e293b;font-style:normal;">
                  ${escapedMessage}
                </div>
              </div>

              <!-- Action Buttons -->
              ${
                actionButtonsHtml
                  ? `
                <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
                  <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;margin-bottom:12px;">
                    Direct Devotee Contact:
                  </div>
                  <div>
                    ${actionButtonsHtml}
                  </div>
                </div>
              `
                  : ""
              }

              <!-- Admin Link -->
              <div style="margin-top:20px;padding:14px 18px;background-color:#f1f5f9;border-radius:10px;font-size:12px;color:#475569;">
                💡 To review, mark as responded, or manage all feedback, open your 
                <a href="${SITE_CONFIG.siteUrl}/admin" style="color:#d97706;font-weight:bold;text-decoration:none;">Admin Portal &rarr;</a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #f1f5f9;padding:18px 24px;text-align:center;font-size:11px;color:#94a3b8;">
              This notification was generated automatically by <strong>templepujasewa</strong> upon submission at the CEO Feedback Portal.<br/>
              Support Contact: ${SITE_CONFIG.contact.phoneDisplay} | ${SITE_CONFIG.contact.email}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatches an email using SMTP (Nodemailer) or Resend API if keys exist.
 * If neither is configured, logs the email payload and persists to disk
 * so development/testing works without failure.
 */
export async function sendCeoMessageEmail(
  payload: CeoEmailPayload
): Promise<EmailSendResult> {
  const recipient = getCeoDestinationEmail();
  const subject = `📩 [templepujasewa] New Message for CEO from ${payload.name}: ${payload.subject || "Devotee Feedback"}`;
  const textContent = formatCeoEmailText(payload);
  const htmlContent = formatCeoEmailHtml(payload);
  const devoteeEmail = extractDevoteeEmail(payload.contact);

  // 1. Try Resend REST API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.RESEND_FROM || "templepujasewa <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          reply_to: devoteeEmail || undefined,
          subject,
          text: textContent,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log(`[email] CEO feedback successfully delivered via Resend to ${recipient} (id: ${data.id})`);
        return { ok: true, provider: "resend", to: recipient, messageId: data.id };
      }
      const errText = await res.text().catch(() => "");
      console.warn("[email] Resend API failed, falling back to SMTP:", errText);
    } catch (e) {
      console.warn("[email] Resend error:", e);
    }
  }

  // 2. Try SMTP via Nodemailer if SMTP_HOST or SMTP_USER is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
      });

      const fromAddress =
        process.env.SMTP_FROM ||
        `"templepujasewa Leadership Desk" <${smtpUser}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        replyTo: devoteeEmail || undefined,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[email] CEO feedback successfully sent via SMTP to ${recipient} (messageId: ${info.messageId})`);
      return { ok: true, provider: "smtp", to: recipient, messageId: info.messageId };
    } catch (err) {
      console.error("[email] SMTP delivery failed:", err);
      // Fall through to dev logger
    }
  }

  // 3. Fallback dev logger: Log clearly and persist to local .data/sent_emails.json
  console.log(`[email] ================= CEO EMAIL NOTIFICATION =================`);
  console.log(`[email] TO: ${recipient}`);
  console.log(`[email] SUBJECT: ${subject}`);
  if (devoteeEmail) console.log(`[email] REPLY-TO: ${devoteeEmail}`);
  console.log(`[email] DEVOTEE: ${payload.name} (${payload.contact})`);
  console.log(`[email] MESSAGE:\n${payload.message}`);
  console.log(`[email] Note: To send real emails, set SMTP_HOST, SMTP_USER, SMTP_PASS (or RESEND_API_KEY) in .env`);
  console.log(`[email] ==========================================================`);

  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = process.env.TTP_DATA_DIR || path.join(process.cwd(), ".data");
    const filePath = path.join(dir, "sent_emails.json");
    fs.mkdirSync(dir, { recursive: true });
    let existing: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {
        existing = [];
      }
    }
    existing.unshift({
      id: payload.id,
      to: recipient,
      subject,
      replyTo: devoteeEmail,
      devotee: { name: payload.name, contact: payload.contact },
      message: payload.message,
      sentAt: new Date().toISOString(),
      provider: "dev-logger",
    });
    fs.writeFileSync(filePath, JSON.stringify(existing.slice(0, 100), null, 2), "utf8");
  } catch {
    // Ignore filesystem fallback error
  }

  return { ok: true, provider: "dev-logger", to: recipient };
}
