import { z } from "zod";

const baseSchema = z.object({
  projectId: z.string().uuid({ message: "Invalid project ID" }),
});

export const requestFormSchema = z.discriminatedUnion("resourceType", [
  baseSchema.extend({
    resourceType: z.literal("github_repo"),
    name: z
      .string()
      .trim()
      .min(1, { message: "Repository name is required" })
      .max(100, { message: "Repository name must be at most 100 characters" })
      .regex(/^[a-zA-Z0-9_.-]+$/, {
        message: "Only alphanumeric characters, dashes, underscores, and dots are allowed",
      }),
    visibility: z.enum(["public", "private"], {
      message: "Please select a valid visibility",
    }),
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
    purpose: z
      .string()
      .trim()
      .min(1, { message: "Purpose is required" })
      .max(250, { message: "Purpose must be at most 250 characters" }),
  }),
  baseSchema.extend({
    resourceType: z.literal("database"),
    engine: z.enum(["postgresql", "mysql", "mongodb"], {
      message: "Please select a valid database engine",
    }),
    size: z.enum(["small", "medium", "large"], {
      message: "Please select a valid size",
    }),
  }),
]);

export type RequestFormInput = z.infer<typeof requestFormSchema>;
