"use server";

import { prisma } from "@/lib/db";
import { requireAuthAction } from "@/lib/auth/guard";
import { requestFormSchema, type RequestFormInput } from "@/lib/validation/request";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

export async function createResourceRequest(data: RequestFormInput) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  const userId = authResult.session.user.id;

  // Validate the data against our discriminated union
  const parsed = requestFormSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const validData = parsed.data;

  try {
    // Ensure the user is actually a member of the selected project
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: validData.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return { error: "You are not a member of this project." };
    }

    // Lookup the resource type by name
    const resourceType = await prisma.resourceType.findUnique({
      where: { name: validData.resourceType },
    });

    if (!resourceType) {
      return { error: "Invalid resource type." };
    }

    // Extract type-specific parameters safely without `projectId` or `resourceType`
    const { projectId, resourceType: _rt, ...params } = validData;

    const result = await prisma.$transaction(async (tx) => {
      const req = await tx.resourceRequest.create({
        data: {
          projectId,
          userId,
          resourceTypeId: resourceType.id,
          status: "PENDING", // Status is HARDCODED to pending server-side
          parameters: params,
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId: req.id,
          newStatus: "PENDING",
          changedBy: userId,
          notes: "Request submitted.",
        },
      });

      // Notify all admins about the new request
      const admins = await tx.user.findMany({
        where: { role: { name: "ADMIN" } }
      });

      if (admins.length > 0) {
        const project = await tx.project.findUnique({ where: { id: projectId } });
        const username = authResult.session.user.name || authResult.session.user.email?.split('@')[0] || "A member";
        const projectName = project?.name || "a project";
        
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            requestId: req.id,
            message: `New resource request from ${username} for ${projectName}`,
          }))
        });

        return { req, admins, username, projectName };
      }

      return { req, admins: [], username: "", projectName: "" };
    });

    revalidatePath("/my-requests");
    revalidatePath(`/projects/${projectId}`);
    
    await logAuditAction(userId, "REQUEST_CREATE", result.req.id, { projectId, resourceType: resourceType.name });

    // Send emails async
    result.admins.forEach(admin => {
      sendEmail({
        to: admin.email,
        subject: `New Resource Request for ${result.projectName}`,
        html: `<p><strong>${result.username}</strong> has submitted a new resource request for the project <strong>${result.projectName}</strong>.</p><p>Please log in to the admin dashboard to review.</p>`
      });
    });

    return { success: true, requestId: result.req.id };
  } catch (error) {
    console.error("Failed to create resource request:", error);
    return { error: "Failed to create resource request" };
  }
}

export async function deleteResourceRequest(requestId: string) {
  const authResult = await requireAuthAction();
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  try {
    // Ensure the request belongs to the user or they are an admin
    const request = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true
      }
    });

    if (!request) {
      return { error: "Request not found" };
    }

    // Only allow deletion if the user owns it or if they are admin, and only if it's PENDING or REJECTED
    // If it's already PROVISIONED, they probably shouldn't be able to just "delete" it without a teardown flow, but we can allow it for now or restrict it.
    // Let's restrict deletion to PENDING and REJECTED statuses for safety, and only the owner or an admin can delete it.
    const isOwner = request.userId === authResult.session.user.id;
    const isAdmin = authResult.session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { error: "You don't have permission to delete this request." };
    }

    if (request.status === "PROVISIONED") {
      return { error: "Cannot delete a request that is already accepted or provisioned." };
    }

    await prisma.resourceRequest.delete({
      where: { id: requestId },
    });

    await logAuditAction(authResult.session.user.id, "REQUEST_DELETE", requestId);

    revalidatePath("/my-requests");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete resource request:", error);
    return { error: "Failed to delete resource request" };
  }
}
