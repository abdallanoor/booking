import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations/auth";
import { generateToken, generateOtp } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";
import { sendOtpEmail } from "@/lib/email/nodemailer";
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

    // Check if user already exists with verified email
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      if (existingUser.isBlocked) {
        return errorResponse(
          "This account has been blocked. Please contact support.",
          403
        );
      }
      
      // If user exists and email is verified, they can't register again
      if (existingUser.emailVerified) {
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
      
      // User exists but email not verified - update pending signup data and send new OTP
      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Hash password before storing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);
      
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      existingUser.pendingSignupData = {
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role || "Guest",
      };
      await existingUser.save();
      
      // Send OTP email
      try {
        await sendOtpEmail(existingUser.email, otp);
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        return errorResponse("Failed to send verification code. Please try again.", 500);
      }
      
      return successResponse(
        {
          email: existingUser.email,
        },
        "Verification code sent! Please check your email.",
        200
      );
    }

    // Generate OTP for new user
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    // Create user with pending signup data (not fully registered yet)
    const user = await User.create({
      email: validatedData.email,
      emailVerified: false,
      isBlocked: false,
      hasPassword: false,
      provider: "local",
      role: "Guest", // Temporary, will be set from pendingSignupData on verification
      name: validatedData.name, // Temporary, will be set from pendingSignupData on verification
      otp,
      otpExpires,
      pendingSignupData: {
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role || "Guest",
      },
    });

    // Send OTP email
    try {
      await sendOtpEmail(user.email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Delete the user if email fails
      await User.deleteOne({ _id: user._id });
      return errorResponse("Failed to send verification code. Please try again.", 500);
    }

    return successResponse(
      {
        email: user.email,
      },
      "Verification code sent! Please check your email.",
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
