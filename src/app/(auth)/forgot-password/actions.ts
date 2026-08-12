"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateInviteToken } from "@/lib/crypto/tokens";
import { sendEmail } from "@/lib/email";
import { buildResetEmail } from "@/lib/email/reset-email";

// Simple in-memory rate limiter for password resets
// Maps email -> timestamp of last request
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function requestPasswordReset(formData: FormData) {
  const emailRaw = formData.get("email");
  
  // 1. Validate email format
  const parsed = forgotPasswordSchema.safeParse({ email: emailRaw });
  if (!parsed.success) {
    // Return generic success to avoid email enumeration even on invalid formats
    return { success: true };
  }
  
  const email = parsed.data.email;

  // 2. Check rate limit
  const now = Date.now();
  const lastRequest = rateLimitMap.get(email);
  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
    // Rate limited. Return generic success.
    return { success: true };
  }
  rateLimitMap.set(email, now);

  // 3. Look up user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  });

  // 4. Verify user is valid for a reset
  // Must exist, be ACTIVE (not already invited/suspended), and not deleted
  if (!user || user.accountStatus !== "ACTIVE" || user.deletedAt) {
    return { success: true }; // Generic success
  }

  // 5. Generate a new secure token
  const { raw, hash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry for resets

  // 6. Transaction: Revoke old invites, flip status, create new invite
  await prisma.$transaction(async (tx) => {
    // Revoke any existing PENDING invitations
    await tx.invitation.updateMany({
      where: { email, status: "PENDING" },
      data: { status: "REVOKED" },
    });

    // Flip user status to INVITED (this instantly revokes their current password/login capability)
    await tx.user.update({
      where: { id: user.id },
      data: { accountStatus: "INVITED" },
    });

    // Create the new invitation record
    // We use their existing roleId, and set invitedBy to themselves
    await tx.invitation.create({
      data: {
        email,
        token: hash,
        roleId: user.roleId,
        invitedBy: user.id, // Self-invited
        status: "PENDING",
        expiresAt,
      },
    });
  });

  // 7. Send the reset email
  const { subject, html } = buildResetEmail({ rawToken: raw });

  try {
    await sendEmail({ to: email, subject, html });
  } catch (err) {
    console.error("Failed to send reset email:", err);
  }

  return { success: true };
}
