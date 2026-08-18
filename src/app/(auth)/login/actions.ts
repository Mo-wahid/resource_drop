"use server";

import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { loginSchema, LoginInput } from "@/lib/validation/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/audit";

export async function loginAction(data: LoginInput) {
  // Server-side Zod validation
  const validatedFields = loginSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      error: "Invalid email or password",
      fieldErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  // Find user for audit logging
  const user = await prisma.user.findUnique({ where: { email } });
  const actorId = user?.id || "UNKNOWN";

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (user) {
      await logAuditAction(actorId, "AUTH_LOGIN_SUCCESS", actorId);
    }

    return { success: true };
  } catch (error) {
    await logAuditAction(actorId, "AUTH_LOGIN_FAILED", actorId, { email });
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Invalid email or password" };
      }
    }
    // Generic error fallback to prevent account enumeration
    return { error: "Invalid email or password" };
  }
}

export async function signOutAction() {
  const session = await auth();
  if (session?.user?.id) {
    await logAuditAction(session.user.id, "AUTH_LOGOUT", session.user.id);
  }
  await signOut({ redirectTo: "/login" });
}
