
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
          { error: "Email and OTP are required." },
          { status: 400 }
      );
    }

    const emailHash = crypto.createHash("sha256")
        .update(email.toLowerCase())
        .digest("hex");

    const [user]: any[] = await db.query(
        "SELECT user_id, timezone FROM User WHERE emailHashed = ?",
        [emailHash]
    );

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userId = user[0].user_id;
    const timezone = user[0].timezone || "UTC";

    // 🔹 Fetch OTP
    const [otpRow]: any[] = await db.query(
        `SELECT token, expires_at, used_at 
       FROM UserToken 
       WHERE user_id = ? AND token = ? 
         AND token_type = 'password_reset'`,
        [userId, otp]
    );

    if (!otpRow || otpRow.length === 0) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    const otpData = otpRow[0];

    // 🔹 Expiration check (use DB time, not JS Date())
    const [checkExpiry]: any[] = await db.query(
        "SELECT UTC_TIMESTAMP() AS now_utc"
    );
    const nowUtc = new Date(checkExpiry[0].now_utc);

    if (new Date(otpData.expires_at) < nowUtc) {
      return NextResponse.json(
          { error: "OTP has expired. Please request a new one." },
          { status: 400 }
      );
    }

    if (otpData.used_at !== null) {
      return NextResponse.json(
          { error: "OTP has already been used." },
          { status: 400 }
      );
    }

    // 🔹 Mark OTP as used (UTC safe)
    await db.query(
        "UPDATE UserToken SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND token = ?",
        [userId, otp]
    );

    // 🔹 Convert expiry to user timezone for frontend feedback
    const [expiryRows]: any[] = await db.query(
        `SELECT CONVERT_TZ(?, '+00:00', ?) AS local_expiry`,
        [otpData.expires_at, timezone]
    );

    return NextResponse.json(
        {
          resetToken: otpData.token,
          expiresAt: expiryRows[0]?.local_expiry,
          timezone,
        },
        { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying password OTP:", error);
    return NextResponse.json(
        { error: "Database Server Error" },
        { status: 500 }
    );
  }
}
