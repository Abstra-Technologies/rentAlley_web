import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import crypto from "crypto";
import { Resend } from "resend";

import { decryptData } from "@/crypto/encrypt";
import { EmailTemplate } from "@/components/email-template";

/* --------------------------------------------------
   CONFIG
-------------------------------------------------- */
const resend = new Resend(process.env.RESEND_API_KEY!);

/* --------------------------------------------------
   EMAIL
-------------------------------------------------- */
async function sendOtpEmail(
    email: string,
    firstName: string,
    otp: string
) {
    const title = "[Upkyp Registration]: Verify your Upkyp account";

    await resend.emails.send({
        from: "Upkyp Registration <hello@upkyp.com>",
        to: [email],
        subject: title,
        react: EmailTemplate({
            title,
            firstName: firstName || "there",
            otp,
            expiry: "10 minutes",
            timezone: "UTC",
        }),
        tags: [
            { name: "type", value: "transactional" },
            { name: "category", value: "otp" },
        ],
    });
}

/* --------------------------------------------------
   API
-------------------------------------------------- */
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
            payload = (await jwtVerify(token, secret)).payload;
        } catch {
            return NextResponse.json(
                { error: "Invalid token. Please log in again." },
                { status: 401 }
            );
        }

        const user_id = payload?.user_id as string;
        if (!user_id) {
            return NextResponse.json(
                { error: "Invalid session data." },
                { status: 400 }
            );
        }

        /* --------------------------------------------------
           FETCH USER
        -------------------------------------------------- */
        const [users] = await db.execute<any[]>(
            "SELECT email, firstName, timezone FROM User WHERE user_id = ?",
            [user_id]
        );

        if (!users.length) {
            return NextResponse.json(
                { error: "User not found." },
                { status: 404 }
            );
        }

        let email: string;
        let firstName: string | undefined;

        try {
            email = await decryptData(
                JSON.parse(users[0].email),
                process.env.ENCRYPTION_SECRET!
            );

            firstName = users[0].firstName
                ? await decryptData(
                    JSON.parse(users[0].firstName),
                    process.env.ENCRYPTION_SECRET!
                )
                : undefined;
        } catch {
            return NextResponse.json(
                { error: "Failed to decrypt user data." },
                { status: 500 }
            );
        }

        const timezone = users[0].timezone || "UTC";

        /* --------------------------------------------------
           RATE LIMIT (3 OTPs / HOUR)
        -------------------------------------------------- */
        const [rateRows] = await db.execute<any[]>(
            `
        SELECT COUNT(*) AS count
        FROM UserToken
        WHERE user_id = ?
          AND token_type = 'email_verification'
          AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR)
      `,
            [user_id]
        );

        // if (rateRows[0].count >= 3) {
        //     return NextResponse.json(
        //         { error: "Too many OTP requests. Please try again later." },
        //         { status: 429 }
        //     );
        // }

        /* --------------------------------------------------
           GENERATE + STORE OTP (UTC)
        -------------------------------------------------- */
        const otp = crypto.randomInt(100000, 999999).toString();

        await db.execute(
            `
        INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
        VALUES (?, 'email_verification', ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))
        ON DUPLICATE KEY UPDATE
          token = VALUES(token),
          created_at = UTC_TIMESTAMP(),
          expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE)
      `,
            [user_id, otp]
        );

        /* --------------------------------------------------
           LOCAL EXPIRY TIME
        -------------------------------------------------- */
        const [expiryRows] = await db.execute<any[]>(
            `
        SELECT CONVERT_TZ(
          DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE),
          '+00:00',
          ?
        ) AS local_expiry
      `,
            [timezone]
        );

        const localExpiry = expiryRows[0]?.local_expiry;

        /* --------------------------------------------------
           SEND EMAIL
        -------------------------------------------------- */
        await sendOtpEmail(email, firstName, otp, localExpiry, timezone);

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
