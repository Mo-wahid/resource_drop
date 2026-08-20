import { prisma } from "@/lib/db";
import { ProjectStatus, RequestStatus } from "@prisma/client";

export async function getAdminDashboardStats() {
  const [
    totalUsers,
    activeProjects,
    pendingRequests,
    provisionedResources,
  ] = await Promise.all([
    // Active users count
    prisma.user.count({
      where: {
        deletedAt: null,
        accountStatus: "ACTIVE",
      },
    }),
    // Active & Planning projects
    prisma.project.count({
      where: {
        deletedAt: null,
        status: { in: [ProjectStatus.PLANNING, ProjectStatus.ACTIVE] },
      },
    }),
    // Pending or Accepted requests requiring attention
    prisma.resourceRequest.count({
      where: {
        deletedAt: null,
        status: RequestStatus.PENDING,
        project: {
          status: {
            notIn: ["COMPLETED", "ARCHIVED"]
          }
        }
      },
    }),
    // Provisioned resources count
    prisma.resourceRequest.count({
      where: {
        deletedAt: null,
        status: RequestStatus.PROVISIONED,
      },
    }),
  ]);

  return {
    totalUsers,
    activeProjects,
    pendingRequests,
    provisionedResources,
  };
}

export async function getRecentPendingRequests(limit: number = 5) {
  return prisma.resourceRequest.findMany({
    where: {
      deletedAt: null,
      status: RequestStatus.PENDING,
      project: {
        status: {
          notIn: ["COMPLETED", "ARCHIVED"]
        }
      }
    },
    take: limit,
    orderBy: [
      { status: "asc" }, // PENDING first
      { createdAt: "desc" },
    ],
    include: {
      project: {
        select: { name: true },
      },
      user: {
        select: { username: true, email: true },
      },
      resourceType: {
        select: { name: true },
      },
    },
  });
}

export async function getAdminRequestStatusBreakdown() {
  const grouped = await prisma.resourceRequest.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
    },
    _count: {
      status: true,
    },
  });

  const countMap: Record<string, number> = {};
  grouped.forEach((g) => {
    countMap[g.status] = g._count.status;
  });

  const allStatuses: RequestStatus[] = [
    RequestStatus.PENDING,
    RequestStatus.PROVISIONED,
    RequestStatus.REJECTED,
    RequestStatus.REVOKED,
  ];

  return allStatuses.map((status) => ({
    status,
    count: countMap[status] || 0,
  }));
}

export async function getAdminProjectStatusBreakdown() {
  const grouped = await prisma.project.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
    },
    _count: {
      status: true,
    },
  });

  const countMap: Record<string, number> = {};
  grouped.forEach((g) => {
    countMap[g.status] = g._count.status;
  });

  const allStatuses: ProjectStatus[] = [
    ProjectStatus.PLANNING,
    ProjectStatus.ACTIVE,
    ProjectStatus.PAUSED,
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED,
  ];

  return allStatuses.map((status) => ({
    status,
    count: countMap[status] || 0,
  }));
}

export async function getRecentAuditEntries(limit: number = 7) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      actor: {
        select: {
          username: true,
          email: true,
        },
      },
    },
  });
}
