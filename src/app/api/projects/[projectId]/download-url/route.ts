import { NextResponse } from "next/server";
import { requireProjectMembershipApi } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { generatePresignedDownloadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // The guard enforces that:
    // 1. The user is authenticated
    // 2. The user has a ProjectMember row for this project
    const authResult = await requireProjectMembershipApi(projectId);
    
    if (authResult instanceof NextResponse) {
      return authResult; // This returns the 401 or 403 response
    }

    // Find the project document
    const document = await prisma.projectDocument.findFirst({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    });

    if (!document) {
      return NextResponse.json(
        { error: "No requirements document uploaded for this project" },
        { status: 404 }
      );
    }

    // Generate a short-lived presigned URL (15 minutes = 900 seconds)
    const url = await generatePresignedDownloadUrl(document.fileUrl, 900);

    return NextResponse.json({ url, filename: document.fileName });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
