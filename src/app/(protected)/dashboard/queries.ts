import { prisma } from "@/lib/db";
import { RequestStatus } from "@prisma/client";

export async function getMemberDashboardStats(userId: string) {
  const [
    assignedProjects,
    pendingRequests,
    provisionedResources,
  ] = await Promise.all([
    // Active / Non-archived projects user is a member of
    prisma.projectMember.count({
      where: {
        userId,
        project: {
          deletedAt: null,
          status: { not: "ARCHIVED" },
        },
      },
    }),
    // User's pending/accepted requests
    prisma.resourceRequest.count({
      where: {
        userId,
        deletedAt: null,
        status: RequestStatus.PENDING,
        project: {
          status: {
            notIn: ["COMPLETED", "ARCHIVED"]
          }
        }
      },
    }),
    // Provisioned resources tied to user's requests or projects
    prisma.resourceRequest.count({
      where: {
        userId,
        deletedAt: null,
        status: RequestStatus.PROVISIONED,
        project: {
          status: {
            notIn: ["COMPLETED", "ARCHIVED"]
          }
        }
      },
    }),
  ]);

  return {
    assignedProjects,
    pendingRequests,
    provisionedResources,
  };
}

export async function getRecentMemberRequests(userId: string, limit: number = 5) {
  return prisma.resourceRequest.findMany({
    where: {
      userId,
      deletedAt: null,
      project: {
        status: {
          notIn: ["COMPLETED", "ARCHIVED"]
        }
      }
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: {
        select: { name: true },
      },
      resourceType: {
        select: { name: true },
      },
    },
  });
}

export async function getMemberRequestStatusBreakdown(userId: string) {
  const grouped = await prisma.resourceRequest.groupBy({
    by: ["status"],
    where: {
      userId,
      deletedAt: null,
      project: {
        status: {
          notIn: ["COMPLETED", "ARCHIVED"]
        }
      }
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
