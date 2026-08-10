"use server";

import { prisma } from "@/lib/db";
import { requireRoleAction } from "@/lib/auth/guard";
import { generateInviteToken } from "@/lib/crypto/tokens";
import { inviteFormSchema, type InviteFormInput } from "@/lib/validation/invite";
import { sendEmail } from "@/lib/email";
import { buildInviteEmail } from "@/lib/email/invite-email";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Create an invitation and send the invite email.
 * Creates the User record immediately with accountStatus=INVITED.
 */
export async function createInvitation(data: InviteFormInput) {
  // 1. Verify caller is an admin
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult) {
    return { error: authResult.error || "Unauthorized" };
  }

  // 2. Validate input
  const parsed = inviteFormSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Invalid input",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { email, role } = parsed.data;

  // 3. Check if an active user already exists with this email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && !existingUser.deletedAt && existingUser.accountStatus !== "INVITED") {
    return { error: "A user with this email already exists" };
  }

  // 4. Look up the role record
  const roleRecord = await prisma.role.findUnique({
    where: { name: role },
  });

  if (!roleRecord) {
    return { error: "Invalid role" };
  }

  // 5. Generate secure token
  const { raw, hash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // 6. Transaction: create/update user + revoke old invitations + create new invitation
  await prisma.$transaction(async (tx) => {
    // Revoke any existing PENDING invitations for this email
    await tx.invitation.updateMany({
      where: { email, status: "PENDING" },
      data: { status: "REVOKED" },
    });

    // Create or update the INVITED user
    if (existingUser) {
      // Re-inviting an existing INVITED user or a soft-deleted user
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          roleId: roleRecord.id,
          accountStatus: "INVITED",
          deletedAt: null,
        },
      });
    } else {
      // Brand new invitation
      await tx.user.create({
        data: {
          email,
          username: email, // Placeholder until they register
          passwordHash: null,
          roleId: roleRecord.id,
          accountStatus: "INVITED",
        },
      });
    }

    // Create the invitation record with the token hash
    await tx.invitation.create({
      data: {
        email,
        token: hash,
        roleId: roleRecord.id,
        invitedBy: authResult.session.user.id,
        status: "PENDING",
        expiresAt,
      },
    });
  });

  // 7. Send the invitation email (outside transaction — email failure shouldn't roll back DB)
  const { subject, html } = buildInviteEmail({
    name: email.split("@")[0], // Fallback name
    rawToken: raw,
    roleName: role,
    expiresAt,
  });

  try {
    await sendEmail({ to: email, subject, html });
  } catch (err) {
    console.error("Failed to send invitation email:", err);
    // Don't return error — invitation was created successfully, email can be resent
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Revoke a pending invitation and delete the associated INVITED user.
 */
export async function revokeInvitation(invitationId: string) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult) {
    return { error: authResult.error || "Unauthorized" };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    return { error: "Invitation not found" };
  }

  if (invitation.status !== "PENDING") {
    return { error: "Only pending invitations can be revoked" };
  }

  await prisma.$transaction(async (tx) => {
    // Revoke the invitation
    await tx.invitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });

    // Delete the INVITED user (they never activated)
    await tx.user.deleteMany({
      where: {
        email: invitation.email,
        accountStatus: "INVITED",
      },
    });
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Resend an invitation with a fresh token and 7-day expiry.
 */
export async function resendInvitation(invitationId: string) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult) {
    return { error: authResult.error || "Unauthorized" };
  }

  const oldInvitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { role: true },
  });

  if (!oldInvitation) {
    return { error: "Invitation not found" };
  }

  if (oldInvitation.status !== "PENDING") {
    return { error: "Only pending invitations can be resent" };
  }

  // Get the associated user's name
  const invitedUser = await prisma.user.findFirst({
    where: { email: oldInvitation.email, accountStatus: "INVITED" },
  });

  const { raw, hash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    // Revoke old invitation
    await tx.invitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });

    // Create new invitation with fresh token
    await tx.invitation.create({
      data: {
        email: oldInvitation.email,
        token: hash,
        roleId: oldInvitation.roleId,
        invitedBy: authResult.session.user.id,
        status: "PENDING",
        expiresAt,
      },
    });
  });

  // Send new email
  const { subject, html } = buildInviteEmail({
    name: invitedUser?.username || oldInvitation.email,
    rawToken: raw,
    roleName: oldInvitation.role.name,
    expiresAt,
  });

  try {
    await sendEmail({ to: oldInvitation.email, subject, html });
  } catch (err) {
    console.error("Failed to send invitation email:", err);
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Delete a user by setting their deletedAt timestamp (soft delete).
 * Prevents an admin from deleting themselves.
 */
export async function deleteUser(userId: string) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult) {
    return { error: authResult.error || "Unauthorized" };
  }

  // Prevent self-deletion
  if (authResult.session.user.id === userId) {
    return { error: "You cannot delete your own account" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: "User not found" };
  }

  if (user.deletedAt) {
    return { error: "User is already deleted" };
  }

  // Soft delete the user
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), accountStatus: "SUSPENDED" }, // Optionally set status
  });

  revalidatePath("/admin/users");
  return { success: true };
}
