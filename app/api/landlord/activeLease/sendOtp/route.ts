import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import nodemailer from "nodemailer";
import moment from "moment-timezone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Helper to send OTP via Gmail (with timezone formatting)
 */
async function sendOtpEmail(
    toEmail: string,
    otp: string,
    localExpiry: string,
    timezone: string
) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: "UpKyp Lease Verification Code",
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color:#2563eb;">Your Lease Verification Code</h2>
        <p>Please use the code below to verify your lease signing:</p>

        <div style="font-size: 2rem; font-weight: bold; color:#059669; letter-spacing: 4px; margin:16px 0;">
          ${otp}
        </div>

        <p>This code will expire at <strong>${localExpiry}</strong> (${timezone}).</p>

        <p>If you did not request this, ignore this email.</p>

        <hr />
        <p style="font-size:0.9rem; color:#6b7280;">© ${new Date().getFullYear()} UpKyp.</p>
      </div>
    `,
    });
}

/**
 * POST /api/landlord/activeLease/sendOtp
 */
export async function POST(req: NextRequest) {
    try {
        const { agreement_id, role, email } = await req.json();

        if (!agreement_id || !role || !email) {
            return NextResponse.json(
                { error: "Missing fields (agreement_id, role, email)." },
                { status: 400 }
            );
        }

        // Get user timezone (fallback: Manila)
        const [userRows]: any = await db.query(
            `
      SELECT timezone 
      FROM User 
      WHERE JSON_UNQUOTE(JSON_EXTRACT(email, '$.ciphertext')) = ? OR email = ?
      LIMIT 1
      `,
            [email, email]
        );

        const timezone = userRows?.[0]?.timezone || "Asia/Manila";

        // Create OTP + expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryUTC = moment.utc().add(10, "minutes").toDate();
        const localExpiry = moment(expiryUTC).tz(timezone).format("MMMM D, YYYY h:mm A");

        /* ---------------------------------------------------------
           STEP 1 — LOOK FOR EXISTING SIGNATURE RECORD
        --------------------------------------------------------- */
        const [existing]: any = await db.query(
            `
      SELECT id 
      FROM LeaseSignature
      WHERE agreement_id = ? AND role = ?
      LIMIT 1
      `,
            [agreement_id, role]
        );

        if (existing.length > 0) {
            // UPDATE EXISTING SIGNATURE
            await db.query(
                `
        UPDATE LeaseSignature
        SET 
          email = ?, 
          otp_code = ?, 
          otp_sent_at = UTC_TIMESTAMP(),
          otp_expires_at = ?, 
          status = 'pending'
        WHERE agreement_id = ? AND role = ?
        `,
                [email, otp, expiryUTC, agreement_id, role]
            );
        } else {
            // INSERT ONLY IF NO RECORD EXISTS
            await db.query(
                `
        INSERT INTO LeaseSignature (
          agreement_id, email, role, otp_code, otp_sent_at, otp_expires_at, status
        )
        VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), ?, 'pending')
        `,
                [agreement_id, email, role, otp, expiryUTC]
            );
        }

        /* ---------------------------------------------------------
           STEP 2 — ENSURE TENANT SIGNATURE RECORD EXISTS (BACKUP)
        --------------------------------------------------------- */
        if (role === "landlord") {
            const [tenantRows]: any = await db.query(
                `
        SELECT t.email AS tenant_email
        FROM LeaseAgreement la
        JOIN Tenant tn ON la.tenant_id = tn.tenant_id
        JOIN User t ON tn.user_id = t.user_id
        WHERE la.agreement_id = ?
        LIMIT 1
        `,
                [agreement_id]
            );

            if (tenantRows.length > 0) {
                let tenantEmail: string | null = null;
                const enc = tenantRows[0].tenant_email;

                try {
                    if (enc?.startsWith("{") || enc?.startsWith("[")) {
                        tenantEmail = decryptData(JSON.parse(enc), process.env.ENCRYPTION_SECRET!);
                    } else {
                        tenantEmail = enc; // plain text
                    }
                } catch (err) {
                    console.warn("⚠️ Failed to decrypt tenant email:", err);
                }

                if (tenantEmail) {
                    // Check if tenant signature exists
                    const [tenantSig]: any = await db.query(
                        `
            SELECT id FROM LeaseSignature
            WHERE agreement_id = ? AND role = 'tenant'
            LIMIT 1
            `,
                        [agreement_id]
                    );

                    if (tenantSig.length > 0) {
                        // UPDATE tenant signature
                        await db.query(
                            `
              UPDATE LeaseSignature
              SET email = ?, status = 'pending',
                  otp_code = NULL,
                  otp_expires_at = NULL,
                  otp_sent_at = NULL
              WHERE agreement_id = ? AND role = 'tenant'
              `,
                            [tenantEmail, agreement_id]
                        );
                    } else {
                        // INSERT tenant signature
                        await db.query(
                            `
              INSERT INTO LeaseSignature (agreement_id, email, role, status)
              VALUES (?, ?, 'tenant', 'pending')
              `,
                            [agreement_id, tenantEmail]
                        );
                    }
                }
            }
        }

        // Send email
        await sendOtpEmail(email, otp, localExpiry, timezone);

        return NextResponse.json({
            success: true,
            message: `OTP sent successfully to ${email}.`,
            expiry_local: localExpiry,
            timezone,
        });
    } catch (error: any) {
        console.error("❌ sendOtp error:", error);
        return NextResponse.json(
            { error: "Failed to send OTP. " + (error.message || "") },
            { status: 500 }
        );
    }
}
