"use server";

import { prisma } from "@/lib/db";
import { requireAuthAction } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { RequestStatus } from "@prisma/client";
import { logAuditAction } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildRequestStatusEmail } from "@/lib/email/request-email";

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
    
    const { subject, html } = buildRequestStatusEmail({
      userName: request.user.username,
      projectName: request.project.name,
      newStatus,
      notes: notes?.trim(),
      requestId,
    });

    sendEmail({
      to: request.user.email,
      subject,
      html
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
      include: { project: true, user: true, resourceType: true }
    });

    if (!request) {
      return { error: "Request not found" };
    }

    if (request.status === "PROVISIONED" || request.status === "REJECTED" || request.status === "REVOKED") {
      return { error: "Request cannot be provisioned in its current status" };
    }

    // Validate connection details based on resource type
    const resourceTypeName = request.resourceType.name;
    const details = data.connectionDetails || {};

    if (resourceTypeName === "github_repo") {
      if (!details.repositoryUrl || typeof details.repositoryUrl !== "string" || !details.repositoryUrl.trim()) {
        return { error: "Repository URL is required" };
      }
    } else if (resourceTypeName === "database") {
      if (!details.connectionString || typeof details.connectionString !== "string" || !details.connectionString.trim()) {
        return { error: "Connection String is required" };
      }
    } else if (resourceTypeName === "object_storage") {
      if (!details.bucketName || typeof details.bucketName !== "string" || !details.bucketName.trim()) {
        return { error: "Bucket Name is required" };
      }
      if (!details.accessKeyId || typeof details.accessKeyId !== "string" || !details.accessKeyId.trim()) {
        return { error: "Access Key ID is required" };
      }
      if (!details.secretAccessKey || typeof details.secretAccessKey !== "string" || !details.secretAccessKey.trim()) {
        return { error: "Secret Access Key is required" };
      }
    } else if (resourceTypeName === "api_key") {
      const keys = (request.parameters as any)?.keys;
      if (Array.isArray(keys) && keys.length > 0) {
        for (const k of keys) {
          if (!details[k] || typeof details[k] !== "string" || !details[k].trim()) {
            return { error: `Key ${k} is required` };
          }
        }
      } else {
        if (!details.apiKey || typeof details.apiKey !== "string" || !details.apiKey.trim()) {
          return { error: "API Key is required" };
        }
      }
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

    const { subject, html } = buildRequestStatusEmail({
      userName: request.user.username,
      projectName: request.project.name,
      newStatus: "PROVISIONED",
      requestId,
    });

    sendEmail({
      to: request.user.email,
      subject,
      html
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to provision request:", error);
    return { error: "Failed to provision resource" };
  }
}
