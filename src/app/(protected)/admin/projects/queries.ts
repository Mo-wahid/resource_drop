import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

export async function getProjects(
  view: "active" | "inactive" = "active",
  page: number = 1,
  pageSize: number = 8,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc"
) {
  const where: any = view === "inactive" 
    ? { status: { in: ["COMPLETED", "PAUSED", "ARCHIVED"] } } 
    : { status: { in: ["PLANNING", "ACTIVE"] }, deletedAt: null };

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

export const getEligibleMembers = unstable_cache(
  async () => {
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
  },
  ["eligible-members"],
  { revalidate: 30 }
);

export const getRoles = unstable_cache(
  async () => {
    return prisma.role.findMany({
      where: {
        name: { not: "ADMIN" }
      },
      orderBy: { name: "asc" },
    });
  },
  ["roles"],
  { revalidate: 300 }
);

export async function getProjectRequests(projectId: string) {
  return prisma.resourceRequest.findMany({
    where: { projectId, deletedAt: null },
    include: {
      user: { select: { username: true, email: true } },
      resourceType: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
