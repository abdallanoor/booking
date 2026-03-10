import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Bypass auth checks for static files/apis to be safe
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Extract path without locale for easy matching
  let pathWithoutLocale = pathname;
  for (const loc of routing.locales) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
      pathWithoutLocale = pathname.slice(loc.length + 1);
      if (pathWithoutLocale === "") pathWithoutLocale = "/";
      break;
    }
  }

  // Determine current locale (fallback to default to avoid redirect loops)
  const userLocale = routing.locales.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
  ) || routing.defaultLocale;

  // 2. Redirect logged-in users away from auth pages (login/register)
  if (token && pathWithoutLocale.startsWith("/auth/")) {
    return NextResponse.redirect(new URL(`/${userLocale}/`, request.url));
  }

  // 3. Protect routes that require login
  const protectedRoutes = [
    "/admin",
    "/hosting",
    "/bookings",
    "/profile",
    "/become-host",
    "/wishlist",
  ];
  
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );

  if (!token && isProtectedRoute) {
    const loginUrl = new URL(`/${userLocale}/auth/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Verify Token & Check Roles (for all protected routes)
  if (token && isProtectedRoute) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;

      // Special Case: Redirect Host/Admin away from "Become Host" page
      if (
        pathWithoutLocale.startsWith("/become-host") &&
        (role === "Host" || role === "Admin")
      ) {
        const destination = role === "Admin" ? "/admin" : "/hosting";
        return NextResponse.redirect(new URL(`/${userLocale}${destination}`, request.url));
      }

      // Role-based access control is handled in layout files
    } catch {
      // Token is invalid/expired
      return NextResponse.redirect(
        new URL(`/api/auth/logout?redirect=/${userLocale}/`, request.url)
      );
    }
  }

  // 5. Final pass to next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
