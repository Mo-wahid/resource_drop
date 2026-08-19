import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isApiRoute = pathname.startsWith("/api/");

  // Unauthenticated users trying to access protected routes
  if (!session) {
    if (pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const role = session.user.role;

  // Authenticated users trying to access login or root
  if (pathname === "/login" || pathname === "/") {
    // If we have a callbackUrl on the login page (when already logged in), we should ideally honor it,
    // but the proxy doesn't easily know if the callbackUrl is valid. 
    // We'll let the client handle callbackUrl routing after login.
    // If they just visit / or /login while authenticated, send them to their dashboard.
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/dashboard", req.url));
  }

  // Role-based protection: non-ADMINs cannot access /admin or /api/admin
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && role !== "ADMIN") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Optional: ADMINs accessing /dashboard could either be allowed or redirected to /admin
  // For now, if an ADMIN manually types /dashboard, we redirect them to /admin to enforce landing page rules
  if (pathname.startsWith("/dashboard") && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

// Match all request paths except for the ones starting with:
// - api/auth (NextAuth endpoints)
// - _next/static (static files)
// - _next/image (image optimization files)
// - favicon.ico, sitemap.xml, robots.txt (metadata files)
export const config = {
  matcher: [
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ],
};
