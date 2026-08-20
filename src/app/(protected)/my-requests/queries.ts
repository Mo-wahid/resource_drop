import { prisma } from "@/lib/db";
import { decryptJson } from "@/lib/encryption";

export async function getResourceTypes() {
  return prisma.resourceType.findMany({
    select: { id: true, name: true, isCustom: true },
    orderBy: { name: "asc" }
  });
}

export async function getMemberAssignedProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["ARCHIVED", "COMPLETED"] },
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
  const where: any = {
    userId,
    deletedAt: null,
    project: {
      status: { notIn: ["ARCHIVED", "COMPLETED"] }
    }
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

export async function getMemberRequestDetail(requestId: string, userId: string) {
  const request = await prisma.resourceRequest.findFirst({
    where: { 
      id: requestId,
      userId: userId, // Ensure user owns the request
      project: {
        status: { notIn: ["ARCHIVED", "COMPLETED"] }
      }
    },
    include: {
      project: { select: { id: true, name: true, status: true } },
      user: {
        select: { id: true, username: true, email: true }
      },
      resourceType: { select: { id: true, name: true, isCustom: true } },
      history: {
        include: {
          changer: {
            select: { username: true }
          }
        },
        orderBy: { changedAt: "desc" }
      },
      comments: {
        include: {
          author: {
            select: { id: true, username: true }
          }
        },
        orderBy: { createdAt: "asc" }
      },
      provisionedResource: {
        include: {
          attachments: true
        }
      },
    }
  });

  if (request?.provisionedResource?.connectionDetails) {
    request.provisionedResource.connectionDetails = decryptJson(JSON.stringify(request.provisionedResource.connectionDetails));
  }

  return request;
}
