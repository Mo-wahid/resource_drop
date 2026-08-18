import { NextResponse } from "next/server";
import { generatePresignedUploadUrl } from "@/lib/s3";
import { requireAuth } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
    }

    // Generate a somewhat unique key for testing
    const timestamp = Date.now();
    const key = `test-uploads/${timestamp}-${filename}`;

    const url = await generatePresignedUploadUrl(key, contentType);

    return NextResponse.json({ url, key });
  } catch (error: unknown) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
