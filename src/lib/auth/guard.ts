import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { session };
}

export async function requireRole(role: string) {
  const result = await requireAuth();
  
  if (result instanceof NextResponse) {
    return result; // It's the 401 error response
  }

  if (result.session.user.role !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return result;
}

export async function requireAuthAction() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  return { session };
}

export async function requireRoleAction(role: string) {
  const result = await requireAuthAction();
  
  if (result.error || !result.session) {
    return { error: result.error || "Unauthorized" };
  }

  if (result.session.user.role !== role) {
    return { error: "Forbidden" };
  }

  return result;
}
