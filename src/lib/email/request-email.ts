import { siteConfig } from "@/config/site";
import { getAppUrl } from "@/lib/utils";

interface NewRequestEmailParams {
  adminName: string;
  requesterName: string;
  projectName: string;
  resourceTypeName: string;
  requestId: string;
}

export function buildNewRequestEmail({
  adminName,
  requesterName,
  projectName,
  resourceTypeName,
  requestId,
}: NewRequestEmailParams): { subject: string; html: string } {
  const appUrl = getAppUrl();
  const requestUrl = `${appUrl}/admin/requests/${requestId}`;

  const subject = `New Resource Request for ${projectName}`;

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
                New Resource Request
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#09090b;font-size:15px;line-height:1.6;">
                Hi <strong>${adminName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:14px;line-height:1.6;">
                <strong>${requesterName}</strong> has submitted a new resource request for the project <strong>${projectName}</strong>.
              </p>
              
              <!-- Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#64748b;"><strong>Resource Type:</strong> <span style="color:#0f172a;">${resourceTypeName}</span></p>
                    <p style="margin:0;font-size:13px;color:#64748b;"><strong>Project:</strong> <span style="color:#0f172a;">${projectName}</span></p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${requestUrl}" 
                       style="display:inline-block;padding:12px 32px;background-color:#0a4d8c;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                      Review Request
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.5;">
                This request requires administrator approval to provision.
              </p>
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
</html>
  `.trim();

  return { subject, html };
}

interface RequestStatusEmailParams {
  userName: string;
  projectName: string;
  newStatus: string;
  notes?: string;
  requestId: string;
}

export function buildRequestStatusEmail({
  userName,
  projectName,
  newStatus,
  notes,
  requestId,
}: RequestStatusEmailParams): { subject: string; html: string } {
  const appUrl = getAppUrl();
  const requestUrl = `${appUrl}/requests/${requestId}`;
  
  // Use a different subject based on if it's provisioned or just a status change
  const isProvisioned = newStatus.toUpperCase() === "PROVISIONED";
  const subject = isProvisioned 
    ? `Resource Provisioned - ${projectName}`
    : `Resource Request Status Update - ${newStatus}`;

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
                ${isProvisioned ? "Resource Provisioned" : "Request Update"}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#09090b;font-size:15px;line-height:1.6;">
                Hi <strong>${userName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:14px;line-height:1.6;">
                ${isProvisioned 
                  ? `Your resource request for <strong>${projectName}</strong> has been successfully provisioned!`
                  : `The status of your resource request for <strong>${projectName}</strong> has been updated to <strong>${newStatus}</strong>.`}
              </p>
              
              <!-- Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#64748b;"><strong>Status:</strong> <span style="color:#0f172a;">${newStatus}</span></p>
                    <p style="margin:0;font-size:13px;color:#64748b;"><strong>Notes:</strong> <span style="color:#0f172a;">${notes || "None"}</span></p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${requestUrl}" 
                       style="display:inline-block;padding:12px 32px;background-color:#0a4d8c;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                      ${isProvisioned ? "View Connection Details" : "View Request"}
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
</html>
  `.trim();

  return { subject, html };
}
