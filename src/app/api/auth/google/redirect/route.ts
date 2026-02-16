import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    console.error("Google Client ID not configured");
    return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_config`);
  }

  // Build the Google OAuth URL
  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  // Store the original referrer to redirect back after auth (optional)
  const { searchParams } = new URL(req.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  // const referer = req.headers.get("referer") || "/";
  const state = Buffer.from(JSON.stringify({ returnTo: callbackUrl })).toString("base64");
  params.set("state", state);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
