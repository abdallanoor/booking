import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Redirect logged-in users away from auth pages (login/register)
  if (token && pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Protect routes that require login
  const protectedRoutes = [
    "/admin",
    "/hosting",
    "/bookings",
    "/profile",
    "/become-host",
    "/wishlist",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verify Token & Check Roles (for all protected routes)
  if (token && isProtectedRoute) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;

      // Special Case: Redirect Host/Admin away from "Become Host" page
      if (
        pathname.startsWith("/become-host") &&
        (role === "Host" || role === "Admin")
      ) {
        const destination = role === "Admin" ? "/admin" : "/hosting";
        return NextResponse.redirect(new URL(destination, request.url));
      }

      // Role-based access control (Admin)
      if (pathname.startsWith("/admin")) {
        if (role !== "Admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }

      // Role-based access control (Hosting)
      if (pathname.startsWith("/hosting")) {
        if (role !== "Host" && role !== "Admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    } catch {
      // Token is invalid/expired
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/hosting/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/become-host/:path*",
    "/wishlist/:path*",
    "/auth/:path*",
  ],
};
