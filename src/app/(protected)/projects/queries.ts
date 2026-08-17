import { prisma } from "@/lib/db";

export async function getMemberProjects(
  userId: string,
  view: "active" | "inactive" = "active",
  page: number = 1,
  pageSize: number = 8,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc"
) {
  const where: import("@prisma/client").Prisma.ProjectWhereInput = {
    deletedAt: null,
    status: view === "inactive" ? { in: ["COMPLETED", "ARCHIVED"] } : { in: ["PLANNING", "ACTIVE", "PAUSED"] },
    members: {
      some: { userId }
    }
  };

  let orderBy: import("@prisma/client").Prisma.ProjectOrderByWithRelationInput = { createdAt: "desc" };
  
  if (sortBy === "status") {
    orderBy = { status: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "creator") {
    orderBy = { creator: { username: sortOrder } };
  }

  const [totalCount, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        creator: {
          select: { username: true }
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
          take: 1,
        },
        _count: {
          select: { members: true }
        },
      },
      orderBy
    })
  ]);

  return {
    projects,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getMemberProjectDetail(projectId: string, userId: string) {
  return prisma.project.findUnique({
    where: {
      id: projectId,
      members: {
        some: { userId }
      }
    },
    include: {
      creator: { select: { username: true } },
      documents: { orderBy: { uploadedAt: "desc" }, take: 1 },
      members: {
        include: {
          user: { select: { id: true, username: true, email: true } },
          role: { select: { id: true, name: true } }
        },
      },
    },
  });
}

export async function getMemberProjectRequests(projectId: string, userId: string) {
  return prisma.resourceRequest.findMany({
    where: { projectId, userId, deletedAt: null },
    include: {
      resourceType: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
