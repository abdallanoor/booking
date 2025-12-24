import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/cookies";
import { successResponse } from "@/lib/api-response";

export async function POST() {
  await clearAuthCookie();
  return successResponse(null, "Logout successful");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.nextUrl);
  const redirectUrl = searchParams.get("redirect") || "/";

  await clearAuthCookie();
  return NextResponse.redirect(new URL(redirectUrl, req.url));
}
