import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { error: "Email address is required" })
    .pipe(z.email({ error: "Please enter a valid email address" })),
  password: z
    .string()
    .min(1, { error: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
