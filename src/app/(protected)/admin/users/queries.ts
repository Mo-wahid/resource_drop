"use server";

import { prisma } from "@/lib/db";

/**
 * Fetch all active (non-deleted) users with their roles.
 */
export async function getActiveUsers(
  page: number = 1,
  pageSize: number = 8,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc"
) {
  let orderBy: any = { createdAt: "desc" };
  
  if (sortBy === "joinedAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "role") {
    orderBy = { role: { name: sortOrder } };
  }

  const where = {
    accountStatus: "ACTIVE" as const,
    deletedAt: null,
  };

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        role: { select: { name: true } },
        _count: { select: { projectMemberships: true } },
      },
      orderBy,
    })
  ]);

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Fetch pending invitations with role and inviter details.
 * Also looks up the associated INVITED user to get the name.
 */
export async function getPendingInvitations() {
  const [invitations, invitedUsers] = await Promise.all([
    prisma.invitation.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        role: { select: { name: true } },
        inviter: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        accountStatus: "INVITED",
      },
      select: { email: true, username: true },
    })
  ]);

  const nameMap = new Map(invitedUsers.map((u) => [u.email, u.username]));

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    name: nameMap.get(inv.email) || "—",
    roleName: inv.role.name,
    inviterName: inv.inviter.username,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    isExpired: inv.expiresAt < new Date(),
  }));
}
