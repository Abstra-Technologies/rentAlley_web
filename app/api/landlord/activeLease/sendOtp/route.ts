import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import moment from "moment-timezone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Helper function to send OTP via Gmail
 */
async function sendOtpEmail(toEmail: string, otp: string, expiry: Date, timezone: string) {
    const localExpiry = moment(expiry).tz(timezone).format("MMMM D, YYYY h:mm A");

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: "UpKyp Lease Verification Code",
        text: `Your UpKyp lease verification code is: ${otp}. It will expire at ${localExpiry} (${timezone}).`,
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color:#2563eb;">Your Lease Verification Code</h2>
        <p>Please use the code below to verify your lease signing:</p>
        <div style="font-size: 2rem; font-weight: bold; color:#059669; letter-spacing: 4px; margin:16px 0;">
          ${otp}
        </div>
        <p>This code will expire at <strong>${localExpiry}</strong> (${timezone}).</p>
        <p>If you did not request this verification, you can safely ignore this email.</p>
        <hr />
        <p style="font-size:0.9rem; color:#6b7280;">© ${new Date().getFullYear()} UpKyp. All rights reserved.</p>
      </div>
    `,
    });
}

/**
 * POST /api/landlord/activeLease/sendOtp
 * Body: { agreement_id: string, role: "landlord" | "tenant", email: string, timezone?: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agreement_id, role, email, timezone = "Asia/Manila" } = body;

        if (!agreement_id || !role || !email) {
            return NextResponse.json(
                { error: "Missing required fields (agreement_id, role, email)." },
                { status: 400 }
            );
        }

        // ✅ Generate OTP and expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // ✅ Store or update LeaseSignature record
        await db.query(
            `
      INSERT INTO LeaseSignature (
        agreement_id, email, role, otp_code, otp_sent_at, otp_expires_at, status
      )
      VALUES (?, ?, ?, ?, NOW(), ?, 'pending')
      ON DUPLICATE KEY UPDATE
        otp_code = VALUES(otp_code),
        otp_sent_at = VALUES(otp_sent_at),
        otp_expires_at = VALUES(otp_expires_at),
        status = 'pending';
      `,
            [agreement_id, email, role, otp, expiry]
        );

        // ✅ Send OTP email using your standardized helper
        await sendOtpEmail(email, otp, expiry, timezone);

        return NextResponse.json({
            success: true,
            message: "OTP sent successfully to registered email.",
        });
    } catch (error: any) {
        console.error("❌ sendOtp error:", error);
        return NextResponse.json(
            { error: "Failed to send OTP. " + (error.message || "") },
            { status: 500 }
        );
    }
}
