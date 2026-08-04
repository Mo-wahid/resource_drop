"use server";

import { z } from "zod";
import { signIn } from "@/auth";
import { loginSchema, LoginInput } from "@/lib/validation/auth";
import { AuthError } from "next-auth";

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

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
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
