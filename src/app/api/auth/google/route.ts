import { NextRequest } from "next/server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return errorResponse("Missing token", 400);
    }

    // Fetch user info from Google using the access token
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!googleRes.ok) {
      return errorResponse("Failed to verify Google token", 401);
    }

    const payload = await googleRes.json();
    console.log("Google Payload:", JSON.stringify(payload, null, 2));
    const { email, name, sub: googleId, picture } = payload;

    await dbConnect();

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        // If the user didn't have an avatar, maybe use Google's?
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        // User verified via Google
        if (!user.emailVerified) {
          user.emailVerified = true;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
        provider: "google",
        emailVerified: true,
        avatar: picture,
        role: "Guest", // Default role
      });
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id.toString(), user.email, user.role);

    // Set HTTP-only cookie
    await setAuthCookie(jwtToken);

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
    console.error("Google login error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Google login failed: ${errorMessage}`, 500);
  }
}
