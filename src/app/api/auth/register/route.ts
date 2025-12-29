import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations/auth";
import { generateToken, generateVerificationToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";
import { sendVerificationEmail } from "@/lib/email/nodemailer";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    // Explicitly reject Admin role attempts
    if (body.role === "Admin") {
      return errorResponse(
        "Cannot register as Admin. Admin accounts must be created internally.",
        403
      );
    }

    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      if (existingUser.isBlocked) {
        return errorResponse(
          "This account has been blocked. Please contact support.",
          403
        );
      }
      if (existingUser.provider === "google" && !existingUser.password) {
        // Link account: Add password to existing Google account
        existingUser.password = validatedData.password;
        existingUser.hasPassword = true;
        await existingUser.save();

        // Generate JWT token
        const token = generateToken(
          existingUser._id.toString(),
          existingUser.email,
          existingUser.role
        );

        // Set HTTP-only cookie
        await setAuthCookie(token);

        return successResponse(
          {
            user: {
              id: existingUser._id,
              name: existingUser.name,
              email: existingUser.email,
              role: existingUser.role,
              emailVerified: existingUser.emailVerified,
            },
          },
          "Account linked successfully. You can now login with password or Google.",
          200
        );
      }
      return errorResponse("Email already registered", 400);
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user
    // role is guaranteed to be Guest or Host by Zod schema, or undefined (defaults to Guest in model)
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password,
      role: validatedData.role || "Guest",
      verificationToken,
      emailVerified: false,
      isBlocked: false,
      hasPassword: true,
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue registration even if email fails
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
        },
      },
      "Registration successful. Please check your email to verify your account.",
      201
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
    console.error("Registration error:", error);
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return errorResponse(message, 500);
  }
}
