import { requireAuth } from "@/lib/auth/guard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;
    
    return NextResponse.json({ session: result.session });
  } catch (error: unknown) {
    console.error("Auth test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
