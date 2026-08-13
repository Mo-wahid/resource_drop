"use server";

import { prisma } from "@/lib/db";
import { requireAuthAction } from "@/lib/auth/guard";
import { requestFormSchema, type RequestFormInput } from "@/lib/validation/request";
import { revalidatePath } from "next/cache";

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

    const request = await prisma.resourceRequest.create({
      data: {
        projectId,
        userId,
        resourceTypeId: resourceType.id,
        status: "PENDING", // Status is HARDCODED to pending server-side
        parameters: params,
      },
    });

    revalidatePath("/my-requests");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, requestId: request.id };
  } catch (error) {
    console.error("Failed to create resource request:", error);
    return { error: "Failed to create resource request" };
  }
}
