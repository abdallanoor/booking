import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import type { User as SerializedUser } from "@/types";

// Re-export User type
export type { SerializedUser };

export async function getServerUser(): Promise<SerializedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  await dbConnect();
  const userData = await User.findById(payload.userId)
    .select("-password")
    .lean();

  if (!userData) {
    return null;
  }

  // Type assertion for lean() result
  // Type assertion for lean() result
  const user = userData as {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
    avatar?: string;
    createdAt?: Date;
    updatedAt?: Date;
    provider: string;
    isBlocked: boolean;
    profileCompleted: boolean;
    phoneNumber?: string;
    country?: string;
    nationalId?: string;
  };

  // Serialize for client components
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as "Guest" | "Host" | "Admin",
    emailVerified: user.emailVerified,
    avatar: user.avatar,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    provider: user.provider as "local" | "google",
    isBlocked: user.isBlocked,
    profileCompleted: user.profileCompleted,
    phoneNumber: user.phoneNumber,
    country: user.country,
    nationalId: user.nationalId,
  };
}
