import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=no_code`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Google OAuth credentials not configured");
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_config`);
    }

    // Exchange the authorization code for tokens
    const redirectUri = `${APP_URL}/api/auth/google/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Failed to exchange code for tokens");
      return NextResponse.redirect(`${APP_URL}/auth/login?error=token_exchange`);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Fetch user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      console.error("Failed to fetch user info from Google");
      return NextResponse.redirect(`${APP_URL}/auth/login?error=user_info`);
    }

    const payload = await userInfoResponse.json();
    const { email, name, sub: googleId, picture } = payload;

    await dbConnect();

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Check if user is blocked
      if (user.isBlocked) {
        return NextResponse.redirect(`${APP_URL}/auth/login?error=blocked`);
      }
      
      // User exists, update googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
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
        role: "Guest",
        isBlocked: false,
        hasPassword: false,
      });
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id.toString(), user.email, user.role);

    // Set HTTP-only cookie
    await setAuthCookie(jwtToken);

    // Redirect to returnTo or home
    let returnTo = "/";
    if (state) {
      try {
        const decodedState = JSON.parse(
          Buffer.from(state, "base64").toString()
        );
        returnTo = decodedState.returnTo || "/";
      } catch (e) {
        console.error("Failed to decode state:", e);
      }
    }
    
    // Ensure returnTo is a valid relative path
    if (returnTo.startsWith("http") || !returnTo.startsWith("/")) {
      returnTo = "/";
    }

    // Remove double slashes if any (though unlikely if APP_URL doesn't have trailing slash)
    const redirectUrl = `${APP_URL}${returnTo}`.replace(/([^:]\/)\/+/g, "$1/");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
  }
}
