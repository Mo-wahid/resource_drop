import { prisma } from "@/lib/db";
import { decryptJson } from "@/lib/encryption";
import { RequestStatus } from "@prisma/client";

export async function getAdminRequests(
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "status",
  sortOrder: "asc" | "desc" = "asc",
  statusFilter?: RequestStatus | RequestStatus[] | "ALL"
) {
  const where: any = {
    deletedAt: null,
    project: {
      status: {
        notIn: ["COMPLETED", "ARCHIVED"]
      }
    },
    user: {
      accountStatus: "ACTIVE",
      deletedAt: null
    }
  };

  if (statusFilter && statusFilter !== "ALL") {
    if (Array.isArray(statusFilter)) {
      where.status = { in: statusFilter };
    } else {
      where.status = statusFilter;
    }
  }

  let orderBy: any = [];
  
  if (sortBy === "status") {
    // Primary sort by status, secondary by createdAt desc
    orderBy = [{ status: sortOrder }, { createdAt: "desc" }];
  } else if (sortBy === "createdAt") {
    orderBy = [{ createdAt: sortOrder }];
  } else if (sortBy === "project") {
    orderBy = [{ project: { name: sortOrder } }, { createdAt: "desc" }];
  } else if (sortBy === "type") {
    orderBy = [{ resourceType: { name: sortOrder } }, { createdAt: "desc" }];
  } else if (sortBy === "user") {
    orderBy = [{ user: { username: sortOrder } }, { createdAt: "desc" }];
  } else {
    // Default: PENDING first, then by date
    orderBy = [{ status: "asc" }, { createdAt: "desc" }];
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
        user: {
          select: { username: true, email: true }
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

export async function getAdminRequestDetail(requestId: string) {
  const request = await prisma.resourceRequest.findFirst({
    where: { 
      id: requestId,
      user: {
        accountStatus: "ACTIVE",
        deletedAt: null
      },
      project: {
        status: {
          notIn: ["COMPLETED", "ARCHIVED"]
        }
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
