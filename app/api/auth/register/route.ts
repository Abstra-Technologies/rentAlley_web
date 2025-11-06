import crypto from "crypto";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";
import { SignJWT } from "jose";
import nodemailer from "nodemailer";
import mysql from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { encryptData } from "@/crypto/encrypt";

// ✅ import the generator utility
import { generateLandlordId, generateTenantId } from "@/utils/id_generator";

const dbConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
};

// 🔹 Helper to hash full name (for exact matches)
function generateNameHash(firstName = "", lastName = "") {
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    if (!fullName) return null;
    return crypto.createHash("sha256").update(fullName).digest("hex");
}

// 🔹 Helper to create token hashes (for partial matches)
function generateNameTokens(firstName = "", lastName = "") {
    const tokens = new Set(
        `${firstName} ${lastName}`.trim().toLowerCase().split(/\s+/)
    ); // e.g., ['bryan','lim']
    const hashedTokens = [...tokens].map((t) =>
        crypto.createHash("sha256").update(t).digest("hex")
    );
    return JSON.stringify(hashedTokens);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { email, password, role, timezone, firstName = "", lastName = "" } = body;

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
        const userType = role.toLowerCase();

        const [existingUser] = await db.execute<any[]>(
            "SELECT user_id FROM User WHERE emailHashed = ?",
            [emailHash]
        );

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: "An account with this email already exists." },
                { status: 400 }
            );
        }

        const [userIdResult] = await db.execute<any[]>("SELECT UUID() AS uuid");
        const user_id = userIdResult[0].uuid;

        const hashedPassword = await bcrypt.hash(password, 10);
        const secret = process.env.ENCRYPTION_SECRET!;

        // 🔐 Encrypt sensitive fields
        const emailEncrypted = JSON.stringify(await encryptData(email, secret));
        const firstEncrypted = firstName
            ? JSON.stringify(await encryptData(firstName, secret))
            : null;
        const lastEncrypted = lastName
            ? JSON.stringify(await encryptData(lastName, secret))
            : null;

        // 🧠 Compute searchable hashes
        const nameHashed = generateNameHash(firstName, lastName);
        const nameTokens = generateNameTokens(firstName, lastName);

        // 🧾 Insert new User record
        await db.execute(
            `INSERT INTO User
             (user_id, email, emailHashed, password, userType, createdAt, updatedAt, emailVerified, timezone, firstName, lastName, nameHashed, nameTokens)
             VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                emailEncrypted,
                emailHash,
                hashedPassword,
                userType,
                0,
                timezone,
                firstEncrypted,
                lastEncrypted,
                nameHashed,
                nameTokens,
            ]
        );

        // ✅ Generate unique IDs for role
        if (role === "tenant") {
            const tenant_id = await generateUniqueTenantId(db);
            await db.execute(`INSERT INTO Tenant (tenant_id, user_id) VALUES (?, ?)`, [
                tenant_id,
                user_id,
            ]);
        } else if (role === "landlord") {
            const landlord_id = await generateUniqueLandlordId(db);
            await db.execute(`INSERT INTO Landlord (landlord_id, user_id) VALUES (?, ?)`, [
                landlord_id,
                user_id,
            ]);
        }

        await db.execute(
            `INSERT INTO ActivityLog (user_id, action, timestamp)
             VALUES (?, ?, NOW())`,
            [user_id, "User registered"]
        );

        const otp = generateOTP();
        const { local_expiry, timezone: tz } = await storeOTP(db, user_id, otp);
        await sendOtpEmail(email, otp, local_expiry, tz);

        // 🔑 JWT
        const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const token = await new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(jwtSecret);

        const response = NextResponse.json(
            { message: "User registered. Please verify your OTP." },
            { status: 201 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            path: "/",
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 2 * 60 * 60,
        });

        await db.commit();
        return response;
    } catch (error: any) {
        await db.rollback();
        console.error("❌ Registration Error:", error);
        return NextResponse.json({ message: "Database Server Error" }, { status: 500 });
    } finally {
        await db.end();
    }
}

// --------------------- HELPERS ------------------------
async function generateUniqueLandlordId(db: mysql.Connection): Promise<string> {
    let landlord_id, exists = true;
    while (exists) {
        landlord_id = generateLandlordId();
        const [rows] = await db.execute<any[]>(
            "SELECT landlord_id FROM Landlord WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );
        exists = rows.length > 0;
    }
    return landlord_id;
}

async function generateUniqueTenantId(db: mysql.Connection): Promise<string> {
    let tenant_id, exists = true;
    while (exists) {
        tenant_id = generateTenantId();
        const [rows] = await db.execute<any[]>(
            "SELECT tenant_id FROM Tenant WHERE tenant_id = ? LIMIT 1",
            [tenant_id]
        );
        exists = rows.length > 0;
    }
    return tenant_id;
}

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

async function storeOTP(connection: mysql.Connection, user_id: string, otp: string) {
    await connection.execute(
        `DELETE FROM UserToken WHERE user_id = ? AND token_type = 'email_verification'`,
        [user_id]
    );

    await connection.execute(
        `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
         VALUES (?, 'email_verification', ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))`,
        [user_id, otp]
    );

    const [rows] = await connection.execute<any[]>(
        `SELECT
             CONVERT_TZ(t.expires_at, '+00:00', u.timezone) AS local_expiry,
             u.timezone
         FROM UserToken t
                  JOIN User u ON u.user_id = t.user_id
         WHERE t.user_id = ? AND t.token_type = 'email_verification'
         ORDER BY t.created_at DESC
         LIMIT 1`,
        [user_id]
    );

    return { local_expiry: rows[0].local_expiry, timezone: rows[0].timezone };
}

async function sendOtpEmail(toEmail: string, otp: string, localExpiry: string, timezone: string) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: "Upkyp Registration: Verify your account",
        text: `Your OTP is: ${otp}. It expires at ${localExpiry} (${timezone}).`,
    });
}