import crypto from "crypto";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { Resend } from "resend";

import { encryptData } from "@/crypto/encrypt";
import { generateLandlordId, generateTenantId } from "@/utils/id_generator";
import { EmailTemplate } from "@/components/email-template";

/* --------------------------------------------------
   CONFIG
-------------------------------------------------- */
const resend = new Resend(process.env.RESEND_API_KEY!);

const dbConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
};

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */
function generateNameHash(firstName = "", lastName = "") {
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    if (!fullName) return null;
    return crypto.createHash("sha256").update(fullName).digest("hex");
}

function generateNameTokens(firstName = "", lastName = "") {
    const tokens = new Set(
        `${firstName} ${lastName}`.trim().toLowerCase().split(/\s+/)
    );
    return JSON.stringify(
        [...tokens].map((t) =>
            crypto.createHash("sha256").update(t).digest("hex")
        )
    );
}

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

/* --------------------------------------------------
   EMAIL
-------------------------------------------------- */
async function sendOtpEmail(
    email: string,
    firstName: string | undefined,
    otp: string,
    expiry: Date,
    timezone: string
) {
    const title = "Verify your Upkyp account";

    // ✅ FIX: Date → string (React-safe)
    const formattedExpiry = expiry.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    await resend.emails.send({
        from: "Upkyp <noreply@upkyp.com>",
        to: [email],
        subject: title,

        // ✅ EXACT pattern you requested
        react: EmailTemplate({
            title,
            firstName: firstName || "there",
            otp,
            expiry: formattedExpiry,
            timezone,
        }),

        tags: [
            { name: "type", value: "transactional" },
            { name: "category", value: "otp" },
        ],
    });
}

/* --------------------------------------------------
   OTP STORAGE
-------------------------------------------------- */
async function storeOTP(
    db: mysql.Connection,
    user_id: string,
    otp: string
) {
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

    const [rows] = await db.execute<any[]>(
        `SELECT
        CONVERT_TZ(t.expires_at, '+00:00', u.timezone) AS local_expiry,
        u.timezone
     FROM UserToken t
     JOIN User u ON u.user_id = t.user_id
     WHERE t.user_id = ?
     ORDER BY t.created_at DESC
     LIMIT 1`,
        [user_id]
    );

    return rows[0];
}

/* --------------------------------------------------
   ROLE IDS
-------------------------------------------------- */
async function generateUniqueLandlordId(db: mysql.Connection) {
    let id: string;
    let exists = true;

    while (exists) {
        id = generateLandlordId();
        const [rows] = await db.execute<any[]>(
            "SELECT landlord_id FROM Landlord WHERE landlord_id = ? LIMIT 1",
            [id]
        );
        exists = rows.length > 0;
    }
    return id!;
}

async function generateUniqueTenantId(db: mysql.Connection) {
    let id: string;
    let exists = true;

    while (exists) {
        id = generateTenantId();
        const [rows] = await db.execute<any[]>(
            "SELECT tenant_id FROM Tenant WHERE tenant_id = ? LIMIT 1",
            [id]
        );
        exists = rows.length > 0;
    }
    return id!;
}

/* --------------------------------------------------
   API
-------------------------------------------------- */
export async function POST(req: NextRequest) {
    const {
        email,
        password,
        role,
        timezone,
        firstName = "",
        lastName = "",
    } = await req.json();

    if (!email || !password || !role) {
        return NextResponse.json(
            { error: "Email, password, and role are required" },
            { status: 400 }
        );
    }

    const db = await mysql.createConnection(dbConfig);
    await db.execute("SET time_zone = '+08:00'");

    try {
        await db.beginTransaction();

        const emailHash = crypto
            .createHash("sha256")
            .update(email.toLowerCase())
            .digest("hex");

        const [existing] = await db.execute<any[]>(
            "SELECT user_id FROM User WHERE emailHashed = ?",
            [emailHash]
        );

        if (existing.length) {
            return NextResponse.json(
                { error: "An account with this email already exists." },
                { status: 400 }
            );
        }

        const [[{ uuid: user_id }]] = await db.execute<any[]>(
            "SELECT UUID() AS uuid"
        );

        const hashedPassword = await bcrypt.hash(password, 10);
        const secret = process.env.ENCRYPTION_SECRET!;

        await db.execute(
            `INSERT INTO User
       (user_id, email, emailHashed, password, userType,
        createdAt, updatedAt, emailVerified, timezone,
        firstName, lastName, nameHashed, nameTokens)
       VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), 0,
               ?, ?, ?, ?, ?)`,
            [
                user_id,
                JSON.stringify(await encryptData(email, secret)),
                emailHash,
                hashedPassword,
                role.toLowerCase(),
                timezone,
                firstName
                    ? JSON.stringify(await encryptData(firstName, secret))
                    : null,
                lastName
                    ? JSON.stringify(await encryptData(lastName, secret))
                    : null,
                generateNameHash(firstName, lastName),
                generateNameTokens(firstName, lastName),
            ]
        );

        if (role === "tenant") {
            await db.execute(
                "INSERT INTO Tenant (tenant_id, user_id) VALUES (?, ?)",
                [await generateUniqueTenantId(db), user_id]
            );
        }

        if (role === "landlord") {
            await db.execute(
                "INSERT INTO Landlord (landlord_id, user_id) VALUES (?, ?)",
                [await generateUniqueLandlordId(db), user_id]
            );
        }

        const otp = generateOTP();
        const { local_expiry, timezone: tz } = await storeOTP(db, user_id, otp);

        await sendOtpEmail(email, firstName, otp, local_expiry, tz);

        const token = await new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

        const response = NextResponse.json(
            { message: "User registered. Please verify your OTP." },
            { status: 201 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 2,
        });

        await db.commit();
        return response;
    } catch (err) {
        await db.rollback();
        console.error("❌ Registration Error:", err);
        return NextResponse.json(
            { error: "Database server error" },
            { status: 500 }
        );
    } finally {
        await db.end();
    }
}
