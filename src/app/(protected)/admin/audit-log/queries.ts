import { prisma } from "@/lib/db";

export async function getAuditLogs(
  page: number = 1,
  pageSize: number = 15,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
  actionFilter?: string
) {
  const where: any = {};

  if (actionFilter && actionFilter !== "ALL") {
    where.action = actionFilter;
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
