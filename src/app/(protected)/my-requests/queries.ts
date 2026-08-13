import { prisma } from "@/lib/db";

export async function getMemberAssignedProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      deletedAt: null,
      status: { not: "ARCHIVED" as const },
      members: {
        some: { userId }
      }
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" }
  });
}

export async function getMemberRequests(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  const where = {
    userId,
    deletedAt: null
  };

  let orderBy: any = { createdAt: "desc" };
  
  if (sortBy === "status") {
    orderBy = { status: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "project") {
    orderBy = { project: { name: sortOrder } };
  } else if (sortBy === "type") {
    orderBy = { resourceType: { name: sortOrder } };
  }

  const [totalCount, requests] = await Promise.all([
    prisma.resourceRequest.count({ where }),
    prisma.resourceRequest.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        project: {
          select: { name: true }
        },
        resourceType: {
          select: { name: true }
        }
      },
      orderBy
    })
  ]);

  return {
    requests,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}
