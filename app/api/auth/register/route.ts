import crypto from "crypto";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { Resend } from "resend";

import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { generateLandlordId, generateTenantId } from "@/utils/id_generator";
import { EmailTemplate } from "@/components/email-template";

/* --------------------------------------------------
   CONFIG (UNCHANGED)
-------------------------------------------------- */
const resend = new Resend(process.env.RESEND_API_KEY!);

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

function hashSHA256(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

async function generateUniqueLandlordId() {
    while (true) {
        const id = generateLandlordId();
        const [rows]: any = await db.execute(
            "SELECT landlord_id FROM Landlord WHERE landlord_id = ? LIMIT 1",
            [id]
        );
        if (rows.length === 0) return id;
    }
}

async function generateUniqueTenantId() {
    while (true) {
        const id = generateTenantId();
        const [rows]: any = await db.execute(
            "SELECT tenant_id FROM Tenant WHERE tenant_id = ? LIMIT 1",
            [id]
        );
        if (rows.length === 0) return id;
    }
}

async function storeOTP(user_id: string, otp: string) {
    await db.execute(
        `DELETE FROM UserToken
         WHERE user_id = ? AND token_type = 'email_verification'`,
        [user_id]
    );

    await db.execute(
        `INSERT INTO UserToken
         (user_id, token_type, token, created_at, expires_at)
         VALUES (?, 'email_verification', ?, UTC_TIMESTAMP(),
         DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))`,
        [user_id, otp]
    );
}

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
    const body = await req.json();

    const {
        email,
        password,
        role,
        timezone = "UTC",
        firstName = "",
        lastName = "",
        google_id = null,
    } = body;

    if (!email || !role) {
        return NextResponse.json(
            { error: "Email and role are required" },
            { status: 400 }
        );
    }

    if (!["tenant", "landlord"].includes(role)) {
        return NextResponse.json(
            { error: "Invalid role" },
            { status: 400 }
        );
    }

    const emailLower = email.toLowerCase();
    const emailHash = hashSHA256(emailLower);
    const secret = process.env.ENCRYPTION_SECRET!;

    await db.beginTransaction();

    try {
        /* ----------------------------------------
           1️⃣ CHECK EXISTING USER (IDEMPOTENT)
        ---------------------------------------- */
        const [existingUsers]: any = await db.execute(
            "SELECT user_id, emailVerified, google_id FROM User WHERE emailHashed = ? LIMIT 1",
            [emailHash]
        );

        let user_id: string;

        if (existingUsers.length > 0) {
            const existing = existingUsers[0];
            user_id = existing.user_id;

            // If already verified and not Google upgrade attempt
            if (existing.emailVerified && !google_id) {
                await db.rollback();
                return NextResponse.json(
                    { error: "Account already exists." },
                    { status: 409 }
                );
            }

            // Google linking upgrade
            if (google_id && !existing.google_id) {
                await db.execute(
                    "UPDATE User SET google_id = ?, emailVerified = 1 WHERE user_id = ?",
                    [google_id, user_id]
                );
            }

            // regenerate OTP if not verified
            if (!existing.emailVerified && !google_id) {
                const otp = generateOTP();
                await storeOTP(user_id, otp);
                await sendOtpEmail(emailLower, firstName, otp);
            }

        } else {
            /* ----------------------------------------
               2️⃣ CREATE USER (ATOMIC INSERT)
            ---------------------------------------- */

            const [[{ uuid }]]: any = await db.execute(
                "SELECT UUID() AS uuid"
            );

            user_id = uuid;

            const hashedPassword = google_id
                ? null
                : await bcrypt.hash(password, 12);

            await db.execute(
                `INSERT INTO User
                (user_id, email, emailHashed, password, userType,
                 createdAt, updatedAt, emailVerified, timezone,
                 firstName, lastName, google_id)
                VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(),
                 ?, ?, ?, ?, ?)`,
                [
                    user_id,
                    JSON.stringify(await encryptData(emailLower, secret)),
                    emailHash,
                    hashedPassword,
                    role,
                    google_id ? 1 : 0,
                    timezone,
                    firstName
                        ? JSON.stringify(await encryptData(firstName, secret))
                        : null,
                    lastName
                        ? JSON.stringify(await encryptData(lastName, secret))
                        : null,
                    google_id || "",
                ]
            );

            /* ----------------------------------------
               3️⃣ CREATE ROLE RECORD
            ---------------------------------------- */

            if (role === "tenant") {
                const tenantId = await generateUniqueTenantId();
                await db.execute(
                    "INSERT INTO Tenant (tenant_id, user_id, employment_type, monthly_income) VALUES (?, ?, '', '')",
                    [tenantId, user_id]
                );
            }

            if (role === "landlord") {
                const landlordId = await generateUniqueLandlordId();
                await db.execute(
                    "INSERT INTO Landlord (landlord_id, user_id) VALUES (?, ?)",
                    [landlordId, user_id]
                );
            }

            /* ----------------------------------------
               4️⃣ SEND OTP (NON GOOGLE)
            ---------------------------------------- */
            if (!google_id) {
                const otp = generateOTP();
                await storeOTP(user_id, otp);
                await sendOtpEmail(emailLower, firstName, otp);
            }
        }

        /* ----------------------------------------
           5️⃣ ISSUE JWT
        ---------------------------------------- */

        const token = await new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

        await db.commit();

        const response = NextResponse.json(
            {
                message: google_id
                    ? "Google registration successful."
                    : "User registered. Please verify OTP.",
            },
            { status: 201 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 2,
        });

        return response;

    } catch (error) {
        await db.rollback();
        console.error("Registration error:", error);

        return NextResponse.json(
            { error: "Registration failed" },
            { status: 500 }
        );
    }
}
