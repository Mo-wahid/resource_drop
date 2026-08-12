import { prisma } from "@/lib/db";

export async function getProjects(
  view: "active" | "archived" = "active",
  page: number = 1,
  pageSize: number = 8,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc"
) {
  const isArchived = view === "archived";
  
  const where = isArchived 
    ? { status: "ARCHIVED" as const } 
    : { status: { not: "ARCHIVED" as const }, deletedAt: null };

  let orderBy: any = { createdAt: "desc" };
  
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
          select: {
            username: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy,
    })
  ]);

  return {
    projects,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getProjectDetail(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
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

export async function getEligibleMembers() {
  return prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      deletedAt: null,
      role: {
        name: { not: "ADMIN" }
      }
    },
    select: { id: true, username: true, email: true },
    orderBy: { username: "asc" },
  });
}

export async function getRoles() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
  });
}
