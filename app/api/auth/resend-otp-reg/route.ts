import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { decryptData } from '@/crypto/encrypt';


export async function POST(req: NextRequest) {
  try {
    console.log("🔍 [Resend OTP] Request received.");

    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json(
          { error: "Unauthorized. No valid session token found." },
          { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    let payload;

    try {
      const verifiedToken = await jwtVerify(token, secret);
      payload = verifiedToken.payload;
    } catch (err) {
      console.error("[Resend OTP] Invalid JWT token.");
      return NextResponse.json(
          { error: "Invalid token. Please log in again." },
          { status: 401 }
      );
    }

    const user_id = payload?.user_id;
    if (!user_id) {
      return NextResponse.json({ error: "Invalid session data." }, { status: 400 });
    }

    console.log(`[Resend OTP] User verified: ${user_id}`);

    const [user] = await db.execute<any[]>(
        "SELECT email, timezone FROM User WHERE user_id = ?",
        [user_id]
    );

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let email = user[0].email;
    const timezone = user[0].timezone || "UTC";

    try {
      email = await decryptData(JSON.parse(email), process.env.ENCRYPTION_SECRET!);
    } catch (err) {
      console.warn("[Resend OTP] Email decryption failed:", err);
      return NextResponse.json({
        error: "Email decryption failed. Please contact support.",
      }, { status: 500 });
    }

    const newOtp = crypto.randomInt(100000, 999999).toString();

    // 🔹 Store OTP in UTC
    await db.execute(
        `
      INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
      VALUES (?, 'email_verification', ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))
      ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = UTC_TIMESTAMP(), expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE)
    `,
        [user_id, newOtp]
    );

    // 🔹 Fetch local expiry in user’s timezone
    const [expiryRows] = await db.execute<any[]>(
        `SELECT CONVERT_TZ(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE), '+00:00', ?) AS local_expiry`,
        [timezone]
    );

    const localExpiry = expiryRows[0]?.local_expiry;

    await sendOtpEmail(email, newOtp, localExpiry, timezone);

    return NextResponse.json({
      message: "New OTP sent. Check your email.",
      expiresAt: localExpiry,
      timezone,
    });
  } catch (error) {
    console.error("[Resend OTP] Error:", error);
    return NextResponse.json(
        { error: "Failed to resend OTP. Please try again." },
        { status: 500 }
    );
  }
}

// 🔹 Send email with local expiry
async function sendOtpEmail(toEmail: string, otp: string, localExpiry: string, timezone: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER!,
      to: toEmail,
      subject: "Upkyp Registration: Your New Registration One-Time Password",
      text: `Your new OTP is: ${otp}. It expires at ${localExpiry} (${timezone}).`,
    });
  } catch (error) {
    console.error("[Email] Failed to send OTP:", error);
  }
}
