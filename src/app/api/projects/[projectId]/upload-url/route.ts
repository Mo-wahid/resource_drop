import { NextResponse } from "next/server";
import { generatePresignedUploadUrl } from "@/lib/s3";
import { requireRole } from "@/lib/auth/guard";
import { z } from "zod";
import crypto from "crypto";

const uploadRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum([
    "application/pdf",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  fileSize: z.number().max(10 * 1024 * 1024, "File size must not exceed 10MB"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    // 1. Verify caller is an admin
    const authResult = await requireRole("ADMIN");
    if (authResult instanceof NextResponse) return authResult;

    // 2. Parse and validate request
    const body = await request.json();
    const parsed = uploadRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { filename, contentType } = parsed.data;

    // 3. (Removed project verification so we can upload for pending projects)

    // 4. Generate unique key
    const uuid = crypto.randomUUID();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `projects/${projectId}/requirements/${uuid}-${sanitizedFilename}`;

    // 5. Generate presigned URL
    const url = await generatePresignedUploadUrl(key, contentType);

    return NextResponse.json({ url, key });
  } catch (error: unknown) {
    console.error("Failed to generate upload URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
