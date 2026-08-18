import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildDailyDigestEmail } from "@/lib/email/digest-email";

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
    // 2. Check for pending requests
    const pendingCount = await prisma.resourceRequest.count({
      where: { status: "PENDING" },
    });

    if (pendingCount === 0) {
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

    // 4. Send the emails concurrently
    const emailPromises = admins.map(admin => {
      const { subject, html } = buildDailyDigestEmail({
        name: admin.username || "Admin",
        pendingCount
      });
      
      return sendEmail({
        to: admin.email,
        subject,
        html
      });
    });

    // Wait for all emails to attempt sending (failures are gracefully swallowed in lib/email)
    await Promise.all(emailPromises);

    return NextResponse.json({ 
      message: `Successfully notified ${admins.length} admins about ${pendingCount} pending requests.`,
      success: true 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Failed to execute pending requests cron job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
