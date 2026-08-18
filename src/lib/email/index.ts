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
