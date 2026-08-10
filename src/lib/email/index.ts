import { Resend } from "resend";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Send an email via Resend.
 * When RESEND_API_KEY is not configured, logs the email to the console for development.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
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

  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    throw error; // Rethrow to let the caller handle the failure if needed
  }
}
