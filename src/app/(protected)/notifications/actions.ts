"use server";

import { prisma } from "@/lib/db";
import { requireAuthAction } from "@/lib/auth/guard";

export async function getUnreadCountAction() {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return 0;
  }

  const count = await prisma.notification.count({
    where: {
      userId: authResult.session.user.id,
      isRead: false
    }
  });

  return count;
}

export async function markAsReadAction(notificationId: string) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return { error: "Notification not found" };
    }

    if (notification.userId !== authResult.session.user.id) {
      return { error: "Unauthorized" };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { error: "Failed to mark as read" };
  }
}

export async function markAllAsReadAction() {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: authResult.session.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { error: "Failed to mark all as read" };
  }
}
