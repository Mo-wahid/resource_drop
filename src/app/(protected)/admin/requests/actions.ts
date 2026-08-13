"use server";

import { prisma } from "@/lib/db";
import { requireAuthAction } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { RequestStatus } from "@prisma/client";

export async function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  notes?: string
) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  if (authResult.session.user.role !== "ADMIN") {
    return { error: "Only administrators can update request status" };
  }

  try {
    const request = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { error: "Request not found" };
    }

    if (request.status === newStatus) {
      return { error: "Request is already in this status" };
    }

    // Perform update in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.resourceRequest.update({
        where: { id: requestId },
        data: { status: newStatus },
      });

      // 2. Add history record
      await tx.requestStatusHistory.create({
        data: {
          requestId,
          changedBy: authResult.session.user.id,
          previousStatus: request.status,
          newStatus,
          notes: notes?.trim() || null,
        },
      });

      // 3. Add a notification for the requesting user
      await tx.notification.create({
        data: {
          userId: request.userId,
          requestId: requestId,
          message: `Your request status changed to ${newStatus}`,
        },
      });
    });

    revalidatePath("/admin/requests");
    revalidatePath(`/admin/requests/${requestId}`);
    revalidatePath("/my-requests");
    revalidatePath(`/requests/${requestId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update request status:", error);
    return { error: "Failed to update status" };
  }
}

export async function addRequestComment(requestId: string, message: string) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  if (!message || message.trim().length === 0) {
    return { error: "Comment cannot be empty" };
  }

  try {
    const request = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { error: "Request not found" };
    }

    // Must be admin or owner
    const isOwner = request.userId === authResult.session.user.id;
    const isAdmin = authResult.session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { error: "Permission denied" };
    }

    await prisma.requestComment.create({
      data: {
        requestId,
        authorId: authResult.session.user.id,
        message: message.trim(),
      },
    });

    // Notify the other party
    if (isAdmin && !isOwner) {
      // Admin commenting -> notify user
      await prisma.notification.create({
        data: {
          userId: request.userId,
          requestId,
          message: "An admin commented on your request",
        },
      });
    } else if (isOwner && !isAdmin) {
      // We don't have a specific admin to notify, maybe don't notify for now or notify all admins. 
      // Skipping for now.
    }

    revalidatePath(`/admin/requests/${requestId}`);
    revalidatePath(`/requests/${requestId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { error: "Failed to add comment" };
  }
}
