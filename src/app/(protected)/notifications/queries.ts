import { prisma } from "@/lib/db";

export async function getNotifications(userId: string, limit: number = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      request: {
        select: {
          id: true,
          project: {
            select: { name: true }
          },
          resourceType: {
            select: { name: true }
          }
        }
      }
    }
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
}
