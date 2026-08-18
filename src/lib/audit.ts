import { prisma } from "@/lib/db";

export async function logAuditAction(
  actorId: string,
  action: string,
  targetId: string,
  details?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetId,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
    // We intentionally don't throw here to avoid breaking the main transaction/action
    // if the audit log fails, though in a highly strict environment we might want to.
  }
}
