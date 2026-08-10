"use server";

import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/crypto/tokens";
import { acceptInviteSchema } from "@/lib/validation/invite";
import * as argon2 from "argon2";
import { z } from "zod";

/**
 * Accept an invitation by setting a password and activating the account.
 */
export async function acceptInvitation(rawToken: string, username: string, password: string, confirmPassword: string) {
  // 1. Validate input
  const parsed = acceptInviteSchema.safeParse({ username, password, confirmPassword });
  if (!parsed.success) {
    return {
      error: "Invalid input",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // 2. Hash the incoming token and look up the invitation
  const tokenHash = hashToken(rawToken);

  const invitation = await prisma.invitation.findUnique({
    where: { token: tokenHash },
    include: { role: true },
  });

  if (!invitation) {
    return { error: "Invalid or expired invitation link" };
  }

  if (invitation.status !== "PENDING") {
    return { error: "This invitation has already been used or revoked" };
  }

  if (invitation.expiresAt < new Date()) {
    return { error: "This invitation has expired. Please contact your administrator for a new one." };
  }

  // 3. Find the associated INVITED user
  const user = await prisma.user.findFirst({
    where: {
      email: invitation.email,
      accountStatus: "INVITED",
    },
  });

  if (!user) {
    return { error: "No matching account found for this invitation" };
  }

  // 4. Hash password and activate in a transaction
  const passwordHash = await argon2.hash(parsed.data.password);

  await prisma.$transaction(async (tx) => {
    // Activate the user and set username
    await tx.user.update({
      where: { id: user.id },
      data: {
        username: parsed.data.username,
        passwordHash,
        accountStatus: "ACTIVE",
      },
    });

    // Mark invitation as used
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });
  });

  // Return success — the client will handle sign-in
  return {
    success: true,
    email: invitation.email,
  };
}
