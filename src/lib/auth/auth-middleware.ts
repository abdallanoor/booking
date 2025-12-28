import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import dbConnect from "../mongodb";
import User, { IUser } from "@/models/User";

export async function getCurrentUser(req: NextRequest): Promise<IUser | null> {
  try {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    await dbConnect();
    const user = await User.findById(payload.userId).select("-password");

    if (user?.isBlocked) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<IUser> {
  const user = await getCurrentUser(req);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireRole(
  req: NextRequest,
  role: string | string[]
): Promise<IUser> {
  const user = await requireAuth(req);

  const allowedRoles = Array.isArray(role) ? role : [role];

  // Admin can access everything, or check if user role is in allowed roles
  if (!allowedRoles.includes(user.role) && user.role !== "Admin") {
    throw new Error("Forbidden");
  }

  return user;
}

export async function requireProfileCompletion(
  req: NextRequest,
  action: "book" | "withdraw"
): Promise<IUser> {
  const user = await requireAuth(req);

  if (!user.checkProfileCompletion(action)) {
    throw new Error("Profile Incomplete");
  }

  return user;
}
