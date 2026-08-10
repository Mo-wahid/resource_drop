"use server";

import { prisma } from "@/lib/db";

/**
 * Fetch all active (non-deleted) users with their roles.
 */
export async function getActiveUsers() {
  return prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      deletedAt: null,
    },
    include: {
      role: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch pending invitations with role and inviter details.
 * Also looks up the associated INVITED user to get the name.
 */
export async function getPendingInvitations() {
  const invitations = await prisma.invitation.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      role: { select: { name: true } },
      inviter: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Look up the INVITED users by email to get names
  const emails = invitations.map((i) => i.email);
  const invitedUsers = await prisma.user.findMany({
    where: {
      email: { in: emails },
      accountStatus: "INVITED",
    },
    select: { email: true, username: true },
  });
  const nameMap = new Map(invitedUsers.map((u) => [u.email, u.username]));

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    name: nameMap.get(inv.email) || inv.email,
    roleName: inv.role.name,
    inviterName: inv.inviter.username,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    isExpired: inv.expiresAt < new Date(),
  }));
}
