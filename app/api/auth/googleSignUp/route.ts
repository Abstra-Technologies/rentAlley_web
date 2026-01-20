import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    console.log("🔵 Google OAuth INIT called");

    const { searchParams } = new URL(req.url);
    const userType = searchParams.get("userType");

    console.log("➡️ userType from query:", userType);

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const REDIRECT_URI = process.env.REDIRECT_URI;

    console.log("➡️ GOOGLE_CLIENT_ID exists:", !!GOOGLE_CLIENT_ID);
    console.log("➡️ REDIRECT_URI:", REDIRECT_URI);

    if (!userType) {
        console.error("❌ Missing userType in query params");
        return NextResponse.json(
            { error: "Role is required" },
            { status: 400 }
        );
    }

    if (!GOOGLE_CLIENT_ID || !REDIRECT_URI) {
        console.error("❌ Missing Google OAuth env vars");
        return NextResponse.json(
            { error: "Google OAuth is not configured properly" },
            { status: 500 }
        );
    }

    const state = JSON.stringify({ userType });

    console.log("➡️ OAuth state payload:", state);

    const googleAuthURL =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `state=${encodeURIComponent(state)}`;

    console.log("🔁 Redirecting to Google OAuth URL:");
    console.log(googleAuthURL);

    return NextResponse.redirect(googleAuthURL);
}
