import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import nodemailer from "nodemailer";
import moment from "moment-timezone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 📧 Helper to send OTP via Gmail
 */
async function sendOtpEmail(toEmail: string, otp: string, localExpiry: string, timezone: string) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: "UpKyp Lease Signing Verification Code",
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color:#2563eb;">Your Lease Signing Code</h2>
        <p>Please use the code below to confirm your lease signing:</p>
        <div style="font-size: 2rem; font-weight: bold; color:#059669; letter-spacing: 4px; margin:16px 0;">
          ${otp}
        </div>
        <p>This code will expire at <strong>${localExpiry}</strong> (${timezone}).</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <hr />
        <p style="font-size:0.9rem; color:#6b7280;">© ${new Date().getFullYear()} UpKyp. All rights reserved.</p>
      </div>
    `,
    });
}

/**
 * ✅ POST /api/tenant/activeLease/sendOtp
 * Body: { agreement_id: string, role: "tenant", email: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agreement_id, role, email } = body;

        if (!agreement_id || !role || !email) {
            return NextResponse.json(
                { error: "Missing required fields (agreement_id, role, email)." },
                { status: 400 }
            );
        }

        // 🔹 Confirm lease & tenant email
        const [leaseRows]: any = await db.query(
            `
      SELECT la.agreement_id, la.status, t.email AS tenant_email
      FROM LeaseAgreement la
      JOIN Tenant tn ON la.tenant_id = tn.tenant_id
      JOIN User t ON tn.user_id = t.user_id
      WHERE la.agreement_id = ?
      LIMIT 1;
      `,
            [agreement_id]
        );

        if (!leaseRows?.length) {
            return NextResponse.json({ error: "Lease not found for this tenant." }, { status: 404 });
        }

        // 🔹 Decrypt email if encrypted
        let tenantEmail: string | null = leaseRows[0].tenant_email;
        try {
            if (tenantEmail?.startsWith("{") || tenantEmail?.startsWith("[")) {
                tenantEmail = decryptData(JSON.parse(tenantEmail), process.env.ENCRYPTION_SECRET!);
            }
        } catch (err) {
            console.warn(`⚠️ Failed to decrypt tenant email for agreement_id ${agreement_id}`, err);
        }

        if (!tenantEmail) {
            return NextResponse.json(
                { error: "Tenant email not available for OTP delivery." },
                { status: 400 }
            );
        }

        // 🔹 Ensure a LeaseSignature record already exists
        const [sigRows]: any = await db.query(
            `SELECT id FROM LeaseSignature WHERE agreement_id = ? AND role = 'tenant' LIMIT 1`,
            [agreement_id]
        );

        if (!sigRows?.length) {
            return NextResponse.json(
                { error: "No existing lease signature record found for tenant." },
                { status: 404 }
            );
        }

        // 🔹 Determine timezone (default: Asia/Manila)
        const [userRows]: any = await db.query(
            `SELECT timezone FROM User WHERE JSON_UNQUOTE(JSON_EXTRACT(email, '$.ciphertext')) = ? OR email = ? LIMIT 1`,
            [tenantEmail, tenantEmail]
        );
        const timezone = userRows?.[0]?.timezone || "Asia/Manila";

        // 🔹 Generate OTP + expiry (10 min)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryUTC = moment.utc().add(10, "minutes").toDate();
        const localExpiry = moment(expiryUTC).tz(timezone).format("MMMM D, YYYY h:mm A");

        // 🔹 Update only (no insert)
        const [updateResult]: any = await db.query(
            `
      UPDATE LeaseSignature
      SET otp_code = ?, otp_sent_at = UTC_TIMESTAMP(), otp_expires_at = ?, status = 'pending'
      WHERE agreement_id = ? AND role = 'tenant';
      `,
            [otp, expiryUTC, agreement_id]
        );

        if (updateResult.affectedRows === 0) {
            return NextResponse.json(
                { error: "Failed to update OTP — no matching record found." },
                { status: 404 }
            );
        }

        // 🔹 Send OTP Email
        await sendOtpEmail(tenantEmail, otp, localExpiry, timezone);

        return NextResponse.json({
            success: true,
            message: `OTP updated and sent successfully to ${tenantEmail}.`,
            expiry_local: localExpiry,
            timezone,
        });
    } catch (error: any) {
        console.error("❌ Tenant sendOtp error:", error);
        return NextResponse.json(
            { error: "Failed to send OTP. " + (error.message || "") },
            { status: 500 }
        );
    }
}
