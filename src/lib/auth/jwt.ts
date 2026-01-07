import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable");
}

import { JWTPayload } from "@/types";

export function generateToken(
  userId: string,
  email: string,
  role: string
): string {
  const payload: JWTPayload = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
