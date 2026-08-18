import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildPendingRequestEmail } from "@/lib/email/digest-email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Verify authorization
  const authHeader = request.headers.get("authorization");
  
  // Also allow passing ?secret=xxx in the URL for easy browser testing locally
  const url = new URL(request.url);
  const urlSecret = url.searchParams.get("secret");
  
  const cronSecret = process.env.CRON_SECRET;

  // If a secret is defined in environment variables, enforce it.
  const hasValidHeader = authHeader === `Bearer ${cronSecret}`;
  const hasValidUrlParam = urlSecret === cronSecret;

  if (cronSecret && !hasValidHeader && !hasValidUrlParam) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch all pending requests with relations
    const pendingRequests = await prisma.resourceRequest.findMany({
      where: { status: "PENDING" },
      include: {
        project: true,
        user: true,
        resourceType: true,
      }
    });

    if (pendingRequests.length === 0) {
      return NextResponse.json({ message: "No pending requests. Emails skipped." }, { status: 200 });
    }

    // 3. Get admins to notify
    const admins = await prisma.user.findMany({
      where: { role: { name: "ADMIN" } },
      select: { email: true, username: true },
    });

    if (admins.length === 0) {
      return NextResponse.json({ message: "No admins found. Emails skipped." }, { status: 200 });
    }

    // 4. Send the emails concurrently (1 email per admin per request)
    const emailPromises = [];

    for (const req of pendingRequests) {
      for (const admin of admins) {
        const { subject, html } = buildPendingRequestEmail({
          adminName: admin.username || "Admin",
          projectName: req.project.name,
          requesterName: req.user.username,
          resourceTypeName: req.resourceType.name,
          requestId: req.id,
        });
        
        emailPromises.push(
          sendEmail({
            to: admin.email,
            subject,
            html
          })
        );
      }
    }

    // Wait for all emails to attempt sending (failures are gracefully swallowed in lib/email)
    await Promise.all(emailPromises);

    return NextResponse.json({ 
      message: `Successfully notified ${admins.length} admins about ${pendingRequests.length} pending requests (${emailPromises.length} emails total).`,
      success: true 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Failed to execute pending requests cron job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
