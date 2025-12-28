import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema } from "@/lib/validations/auth";
import { generateToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    // Check if user is blocked
    if (user.isBlocked === true) {
      return errorResponse(
        "Your account has been blocked. Please contact support.",
        403
      );
    }

    // Check if user is Google user without password
    if (user.provider === "google" && !user.password) {
      return errorResponse(
        "This email is associated with a Google account. Please use Google Sign-In or use the Sign Up page to add a password.",
        400
      );
    }

    // Check password
    const isValidPassword = await user.comparePassword(validatedData.password);
    if (!isValidPassword) {
      return errorResponse("Invalid email or password", 401);
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Set HTTP-only cookie
    await setAuthCookie(token);

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
        },
      },
      "Login successful"
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return errorResponse("Validation error", 400, error);
    }
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Login failed";
    return errorResponse(message, 500);
  }
}
