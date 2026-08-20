import { z } from "zod";

const baseSchema = z.object({
  projectId: z.string().uuid({ message: "Invalid project ID" }),
});

export const requestFormSchema = z.union([
  baseSchema.extend({
    resourceType: z.literal("github_repo"),
    // No additional parameters needed for github_repo
  }),
  baseSchema.extend({
    resourceType: z.literal("object_storage"),
    purpose: z
      .string()
      .trim()
      .min(1, { message: "Purpose is required" })
      .max(250, { message: "Purpose must be at most 250 characters" }),
  }),
  baseSchema.extend({
    resourceType: z.literal("api_key"),
    keys: z
      .array(z.string().trim().min(1, { message: "Key name cannot be empty" }))
      .min(1, { message: "At least one key is required" })
      .max(10, { message: "You can request at most 10 keys at once" }),
  }),
  baseSchema.extend({
    resourceType: z.literal("database"),
    engine: z.enum(["postgresql", "mysql", "mongodb"], {
      message: "Please select a valid database engine",
    }),
  }),
  baseSchema.extend({
    resourceType: z.literal("create_custom"),
    customName: z.string().trim().min(1, { message: "Name is required" }),
    customDescription: z.string().trim().optional(),
  }),
  baseSchema.extend({
    resourceType: z.string(), // Catch-all for existing dynamic custom types
  }),
]);

export type RequestFormInput = z.infer<typeof requestFormSchema>;
