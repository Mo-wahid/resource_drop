import { BrevoClient } from "@getbrevo/brevo";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const brevoApiKey = process.env.BREVO_API_KEY;
const brevo = brevoApiKey ? new BrevoClient({ apiKey: brevoApiKey }) : null;

/**
 * Send an email via Brevo.
 * When BREVO_API_KEY is not configured, logs the email to the console for development.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!brevo) {
    // Development fallback — log to console
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║             📧  EMAIL (Dev Mode)                ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log(`║  To:      ${to}`);
    console.log(`║  Subject: ${subject}`);
    console.log("╠══════════════════════════════════════════════════╣");
    console.log(html);
    console.log("╚══════════════════════════════════════════════════╝\n");
    return;
  }

  // Fallback if not configured
  const fromEmail = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
  const fromName = "ResourceDrop"; // You can make this configurable too

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
    // Intentionally swallowed so email failures don't block critical app actions.
  }
}

import { siteConfig } from "@/config/site";

export function buildGenericEmail(content: string, cta?: { text: string, url: string }, footerText?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0a4d8c;padding:32px 32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">
                ${siteConfig.nameFull}
              </h1>
              <p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;">
                ${siteConfig.tagline}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
              ${cta ? `
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${cta.url}" 
                       style="display:inline-block;padding:12px 32px;background-color:#0a4d8c;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                      ${cta.text}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              ${footerText ? `
              <p style="margin:0;color:#a1a1aa;font-size:11px;line-height:1.5;">
                ${footerText}
              </p>
              ` : ''}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:11px;">
                © ${new Date().getFullYear()} ${siteConfig.nameFull}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
