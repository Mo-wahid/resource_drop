import { prisma } from "@/lib/db";

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  actionFilter?: string;
  actorId?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const {
    page = 1,
    pageSize = 15,
    sortBy = "createdAt",
    sortOrder = "desc",
    actionFilter,
    actorId,
    targetId,
    startDate,
    endDate
  } = filters;

  const where: any = {};

  if (actionFilter && actionFilter !== "ALL") {
    where.action = { startsWith: actionFilter };
  }
  
  if (actorId) {
    where.actorId = actorId;
  }
  
  if (targetId) {
    where.targetId = targetId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  let orderBy: any = { createdAt: sortOrder };

  if (sortBy === "action") {
    orderBy = { action: sortOrder };
  } else if (sortBy === "actor") {
    orderBy = { actor: { username: sortOrder } };
  }

  const [totalCount, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy,
    }),
  ]);

  return {
    logs,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}
