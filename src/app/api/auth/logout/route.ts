import { clearAuthCookie } from "@/lib/auth/cookies";
import { successResponse } from "@/lib/api-response";

export async function POST() {
  await clearAuthCookie();
  return successResponse(null, "Logout successful");
}
