"use server";

import { prisma } from "@/lib/db";
import { requireRoleAction } from "@/lib/auth/guard";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validation/project";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, Project } from "@prisma/client";
import { deleteBlob } from "@/lib/storage";
import { logAuditAction } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

type ProjectStatus = Project["status"];

/**
 * Create a new project.
 * Enforces ADMIN role and catches Prisma P2002 unique constraint violations.
 */
export async function createProject(data: CreateProjectInput) {
  // 1. Verify caller is an admin
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  // 2. Validate input
  const parsed = createProjectSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Invalid input",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { id, name, description, memberIds, requirementsDocument } = parsed.data;

  try {
    // 3. Look up team member role if we have members to add
    let teamMemberRoleId: string | undefined;
    if (memberIds && memberIds.length > 0) {
      const role = await prisma.role.findUnique({ where: { name: "TEAM_MEMBER" } });
      if (!role) return { error: "Team member role not found" };
      teamMemberRoleId = role.id;
    }

    // 4. Create the project and related data in a transaction
    const project = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          id, // optional: if passed, it's used; else auto-generated
          name,
          description,
          createdBy: authResult.session!.user.id,
          members: (memberIds && memberIds.length > 0 && teamMemberRoleId) ? {
            create: memberIds.map((userId) => ({
              userId,
              projectRoleId: teamMemberRoleId,
            }))
          } : undefined
        },
      });

      if (requirementsDocument) {
        await tx.projectDocument.create({
          data: {
            projectId: createdProject.id,
            fileUrl: requirementsDocument.url, // Vercel Blob returns a URL instead of a key
            fileName: requirementsDocument.filename,
            uploadedBy: authResult.session!.user.id,
          },
        });
      }

      // Notify new members
      if (memberIds && memberIds.length > 0) {
        await tx.notification.createMany({
          data: memberIds.map((userId) => ({
            userId,
            message: `You have been added to the project: ${name}`,
            linkUrl: `/projects/${createdProject.id}`,
          })),
        });
      }

      return createdProject;
    });

    await logAuditAction(authResult.session!.user.id, "PROJECT_CREATE", project.id, { name: project.name });

    revalidatePath("/admin/projects");
    return { success: true, projectId: project.id };
  } catch (error) {
    // Catch unique constraint violation on Project.name
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          error: "Validation failed",
          fieldErrors: { name: ["A project with this name already exists"] },
        };
      }
    }
    console.error("Failed to create project:", error);
    return { error: "Failed to create project. Please try again." };
  }
}

/**
 * Confirms that a requirements document has been uploaded to Vercel Blob.
 * Creates a new ProjectDocument row and deletes any existing one.
 */
export async function confirmRequirementsUpload(projectId: string, blobUrl: string, originalFilename: string) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  let oldUrls: string[] = [];

  await prisma.$transaction(async (tx) => {
    // Delete existing requirements documents for this project
    const existingDocs = await tx.projectDocument.findMany({
      where: { projectId },
    });
    
    oldUrls = existingDocs.map(doc => doc.fileUrl);

    await tx.projectDocument.deleteMany({
      where: { projectId },
    });

    // Create the new one
    await tx.projectDocument.create({
      data: {
        projectId,
        fileUrl: blobUrl,
        fileName: originalFilename,
        uploadedBy: authResult.session.user.id,
      },
    });
  });

  // Delete orphaned physical files from Vercel Blob
  for (const url of oldUrls) {
    if (url) await deleteBlob(url);
  }

  await logAuditAction(authResult.session.user.id, "PROJECT_DOC_UPLOAD", projectId, { fileName: originalFilename });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

/**
 * Removes the requirements document from a project.
 */
export async function removeRequirementsDocument(projectId: string) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  const documents = await prisma.projectDocument.findMany({
    where: { projectId },
  });

  await prisma.projectDocument.deleteMany({
    where: { projectId },
  });

  // Delete physical files from Vercel Blob
  for (const doc of documents) {
    if (doc.fileUrl) await deleteBlob(doc.fileUrl);
  }

  await logAuditAction(authResult.session.user.id, "PROJECT_DOC_REMOVE", projectId);

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

/**
 * Syncs project members by adding new ones and removing unselected ones.
 * New members get the default TEAM_MEMBER role.
 */
export async function syncProjectMembers(projectId: string, userIds: string[]) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult) {
    return { error: authResult.error || "Unauthorized" };
  }

  try {
    const role = await prisma.role.findUnique({ where: { name: "TEAM_MEMBER" } });
    if (!role) return { error: "Team member role not found" };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });
    
    if (!project) return { error: "Project not found" };
    
    const currentMemberIds = project.members.map(m => m.userId);
    const toAdd = userIds.filter(id => !currentMemberIds.includes(id));
    const toRemove = currentMemberIds.filter(id => !userIds.includes(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      return { success: true };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          delete: toRemove.map(userId => ({
            projectId_userId: { projectId, userId }
          })),
          create: toAdd.map(userId => ({
            userId,
            projectRoleId: role.id,
          }))
        }
      }
    });

    if (toAdd.length > 0) {
      await prisma.notification.createMany({
        data: toAdd.map((userId) => ({
          userId,
          message: `You have been added to the project: ${project.name}`,
          linkUrl: `/projects/${projectId}`,
        })),
      });

      const addedUsers = await prisma.user.findMany({
        where: { id: { in: toAdd } },
        select: { email: true, username: true }
      });

      addedUsers.forEach(user => {
        sendEmail({
          to: user.email,
          subject: `Added to Project: ${project.name}`,
          html: `<p>Hi ${user.username},</p><p>You have been added to the project <strong>${project.name}</strong>.</p><p>Log in to your dashboard to view the project details and collaborate.</p>`
        });
      });
    }

    await logAuditAction(authResult.session.user.id, "PROJECT_MEMBER_SYNC", projectId, { added: toAdd.length, removed: toRemove.length });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to sync members:", err);
    return { error: "Failed to update project members." };
  }
}

/**
 * Removes a member from a project.
 */
export async function removeProjectMember(projectId: string, userId: string) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult) {
    return { error: authResult.error || "Unauthorized" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      members: {
        delete: {
          projectId_userId: { projectId, userId }
        }
      }
    }
  });

  await logAuditAction(authResult.session.user.id, "PROJECT_MEMBER_REMOVE", projectId, { removedUserId: userId });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

/**
 * Updates a member's role within a project.
 */
export async function updateProjectMemberRole(projectId: string, userId: string, roleId: string) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult) {
    return { error: authResult.error || "Unauthorized" };
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (role?.name === "ADMIN") {
    return { error: "Cannot assign the global ADMIN role as a project member role." };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      members: {
        update: {
          where: { projectId_userId: { projectId, userId } },
          data: { projectRoleId: roleId }
        }
      }
    }
  });

  await logAuditAction(authResult.session.user.id, "PROJECT_MEMBER_UPDATE", projectId, { updatedUserId: userId, newRoleId: roleId });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

/**
 * Archives a project (soft delete).
 */
export async function archiveProject(projectId: string) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { 
      status: "ARCHIVED",
      deletedAt: new Date()
    },
  });

  await logAuditAction(authResult.session.user.id, "PROJECT_DELETE", projectId, { status: "ARCHIVED" });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

/**
 * Updates a project's status.
 */
export async function updateProjectStatus(projectId: string, newStatus: ProjectStatus) {
  const authResult = await requireRoleAction("ADMIN");
  if ("error" in authResult || !authResult.session) {
    return { error: authResult.error || "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  // If setting to ARCHIVED, we might want to also set deletedAt, but for simplicity, we'll just set status.
  const deletedAt = newStatus === "ARCHIVED" ? new Date() : null;

  await prisma.project.update({
    where: { id: projectId },
    data: { 
      status: newStatus,
      deletedAt
    },
  });

  await logAuditAction(authResult.session.user.id, "PROJECT_UPDATE", projectId, { status: newStatus });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}
