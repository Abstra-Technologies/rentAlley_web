import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";
import { SignJWT } from "jose";
import nodemailer from "nodemailer";
import { encryptData } from "@/crypto/encrypt";
import { generateLandlordId, generateTenantId } from "@/utils/id_generator";

const dbConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
};

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
        return NextResponse.json({ error: "Code and state are required" }, { status: 400 });
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI, JWT_SECRET, ENCRYPTION_SECRET } =
        process.env;

    const { userType } = JSON.parse(decodeURIComponent(state)) || {};
    const role = userType?.trim().toLowerCase() || "tenant";

    const db = await mysql.createConnection(dbConfig);
    await db.execute("SET time_zone = '+08:00'");

    try {
        // -------------------- GOOGLE TOKEN & USER INFO --------------------
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: REDIRECT_URI!,
                grant_type: "authorization_code",
            }).toString(),
        });

        const tokenData = await tokenRes.json();
        const access_token = tokenData.access_token;

        if (!access_token) throw new Error("Google OAuth failed to return access_token");

        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const userInfo = await userInfoRes.json();
        const googleId = userInfo.sub;
        const email = userInfo.email?.trim().toLowerCase();
        const firstName = userInfo.given_name || "Unknown";
        const lastName = userInfo.family_name || "Unknown";
        const profilePicture = userInfo.picture || null;

        if (!googleId || !email) {
            throw new Error("Google OAuth failed: missing googleId or email");
        }

        const emailHash = crypto.createHash("sha256").update(email).digest("hex");

        // -------------------- START TRANSACTION --------------------
        await db.beginTransaction();

        // Check if user already exists (idempotent)
        const [existingUsers]: any = await db.execute(
            "SELECT user_id FROM User WHERE emailHashed = ? OR google_id = ? LIMIT 1",
            [emailHash, googleId]
        );

        let user_id: string;
        if (existingUsers.length > 0) {
            user_id = existingUsers[0].user_id;
        } else {
            // Encrypt sensitive info
            const emailEncrypted = JSON.stringify(await encryptData(email, ENCRYPTION_SECRET!));
            const firstEncrypted = JSON.stringify(await encryptData(firstName, ENCRYPTION_SECRET!));
            const lastEncrypted = JSON.stringify(await encryptData(lastName, ENCRYPTION_SECRET!));
            const photoEncrypted = profilePicture
                ? JSON.stringify(await encryptData(profilePicture, ENCRYPTION_SECRET!))
                : null;

            // Create new user
            const [uuidRow] = await db.execute<any[]>("SELECT UUID() AS uuid");
            user_id = uuidRow[0].uuid;

            await db.execute(
                `INSERT INTO User 
                (user_id, firstName, lastName, email, emailHashed, google_id, userType, profilePicture, emailVerified, status, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
                [
                    user_id,
                    firstEncrypted,
                    lastEncrypted,
                    emailEncrypted,
                    emailHash,
                    googleId,
                    role,
                    photoEncrypted,
                    0,
                ]
            );

            // Role-specific table
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

            // Log activity
            await db.execute(
                `INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, UTC_TIMESTAMP())`,
                [user_id, "User registered via Google"]
            );
        }

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        await db.execute(
            `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
             VALUES (?, 'email_verification', ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))
             ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = UTC_TIMESTAMP(), expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE)`,
            [user_id, otp]
        );

        await sendOtpEmail(email, otp);

        // Generate JWT
        const jwtSecret = new TextEncoder().encode(JWT_SECRET!);
        const token = await new SignJWT({ user_id, email, role })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            .setSubject(user_id)
            .sign(jwtSecret);

        await db.commit();

        const response = NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_BASE_URL}/pages/auth/verify-email`
        );
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        return response;
    } catch (error: any) {
        await db.rollback();
        console.error("Google OAuth Signup Error:", error.message || error);
        return NextResponse.json({ error: "Failed to register/login with Google" }, { status: 500 });
    } finally {
        await db.end();
    }
}

// ---------------- HELPERS ----------------

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

async function sendOtpEmail(toEmail: string, otp: string) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: "Upkyp Registration OTP",
        text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
    });
}
