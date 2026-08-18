import { siteConfig } from "@/config/site";

interface DigestEmailParams {
  name: string;
  pendingCount: number;
}

/**
 * Build the HTML for a daily digest email.
 */
export function buildDailyDigestEmail({ name, pendingCount }: DigestEmailParams): {
  subject: string;
  html: string;
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const requestsUrl = `${appUrl}/admin/requests`;
  
  const pluralS = pendingCount === 1 ? "" : "s";
  const subject = `Action Required: ${pendingCount} Pending Request${pluralS}`;

  const html = `
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
              <p style="margin:0 0 16px;color:#09090b;font-size:15px;line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:14px;line-height:1.6;">
                This is your daily summary from <strong>${siteConfig.nameFull}</strong>. There ${pendingCount === 1 ? 'is' : 'are'} currently <strong>${pendingCount} pending resource request${pluralS}</strong> that require your attention.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${requestsUrl}" 
                       style="display:inline-block;padding:12px 32px;background-color:#0a4d8c;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                      Review Requests
                    </a>
                  </td>
                </tr>
              </table>
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

  return { subject, html };
}
