import { z } from "zod";

export const inviteFormSchema = z.object({
  email: z
    .string()
    .min(1, { error: "Email is required" })
    .pipe(z.email({ error: "Please enter a valid email address" })),
  role: z.enum(["ADMIN", "TEAM_MEMBER"], {
    error: "Please select a valid role",
  }),
});

export type InviteFormInput = z.infer<typeof inviteFormSchema>;

export const acceptInviteSchema = z
  .object({
    username: z
      .string()
      .min(3, { error: "Username must be at least 3 characters" })
      .max(30, { error: "Username must be at most 30 characters" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .regex(/[a-z]/, { error: "Password must contain at least one lowercase letter" })
      .regex(/[A-Z]/, { error: "Password must contain at least one uppercase letter" })
      .regex(/[0-9]/, { error: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { error: "Password must contain at least one special character" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
