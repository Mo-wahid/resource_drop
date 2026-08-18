"use server";

import { prisma } from "@/lib/db";
import { requireAuthAction } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { RequestStatus } from "@prisma/client";
import { logAuditAction } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

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
      include: { user: true, project: true },
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

    await logAuditAction(authResult.session.user.id, `REQUEST_STATUS_${newStatus}`, requestId, { previousStatus: request.status, notes });
    
    sendEmail({
      to: request.user.email,
      subject: `Resource Request Status Update - ${newStatus}`,
      html: `<p>Hi ${request.user.username},</p><p>The status of your resource request for <strong>${request.project.name}</strong> has been updated to <strong>${newStatus}</strong>.</p><p>Notes: ${notes || "None"}</p><p>Please log in to your dashboard to see more details.</p>`
    });

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
      // Member commenting -> notify all admins
      const admins = await prisma.user.findMany({
        where: { role: { name: "ADMIN" } }
      });
      
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            requestId,
            message: `${authResult.session.user.name || authResult.session.user.email?.split('@')[0] || "A member"} commented on their request`,
          }))
        });
      }
    }

    revalidatePath(`/admin/requests/${requestId}`);
    revalidatePath(`/requests/${requestId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { error: "Failed to add comment" };
  }
}

export async function provisionRequestAction(
  requestId: string,
  data: { vaultReference?: string; connectionDetails?: any }
) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  if (authResult.session.user.role !== "ADMIN") {
    return { error: "Only administrators can provision resources" };
  }

  try {
    const request = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
      include: { project: true, user: true }
    });

    if (!request) {
      return { error: "Request not found" };
    }

    if (request.status === "PROVISIONED" || request.status === "REJECTED" || request.status === "REVOKED") {
      return { error: "Request cannot be provisioned in its current status" };
    }

    // Perform provision in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create ProvisionedResource
      await tx.provisionedResource.create({
        data: {
          projectId: request.projectId,
          resourceTypeId: request.resourceTypeId,
          requestId: request.id,
          vaultReference: data.vaultReference || null,
          connectionDetails: data.connectionDetails || {},
        },
      });

      // 2. Update status
      const newStatus = "PROVISIONED";
      await tx.resourceRequest.update({
        where: { id: requestId },
        data: { status: newStatus },
      });

      // 3. Add history record
      await tx.requestStatusHistory.create({
        data: {
          requestId,
          changedBy: authResult.session.user.id,
          previousStatus: request.status,
          newStatus,
          notes: "Resource provisioned successfully.",
        },
      });

      // 4. Add a notification for the requesting user
      await tx.notification.create({
        data: {
          userId: request.userId,
          requestId: requestId,
          message: "Your requested resource has been provisioned.",
        },
      });
    });

    revalidatePath("/admin/requests");
    revalidatePath(`/admin/requests/${requestId}`);
    revalidatePath("/my-requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/projects/${request.projectId}`);
    
    await logAuditAction(authResult.session.user.id, "REQUEST_PROVISION", requestId, { vaultReference: data.vaultReference });

    sendEmail({
      to: request.user.email,
      subject: `Resource Provisioned - ${request.project.name}`,
      html: `<p>Hi ${request.user.username},</p><p>Your resource request for <strong>${request.project.name}</strong> has been successfully provisioned!</p><p>Please log in to your dashboard to access the connection details.</p>`
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to provision request:", error);
    return { error: "Failed to provision resource" };
  }
}
