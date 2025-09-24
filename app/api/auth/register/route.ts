import crypto from "crypto";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";
import { SignJWT } from "jose";
import nodemailer from "nodemailer";
import mysql from 'mysql2/promise';
import { NextRequest, NextResponse } from "next/server";
import { encryptData } from "@/crypto/encrypt";

const dbConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
};

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { email, password, role, timezone  } = body;

    if (!email || !password || !role) {
        console.error("Missing fields in request body:", body);
        return NextResponse.json({ error: "Email, password, and role are required" }, { status: 400 });
    }

    const db = await mysql.createConnection(dbConfig);
    await db.execute("SET time_zone = '+08:00'");

    try {
        await db.beginTransaction();

        const emailHash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
        const userType = role.toLowerCase();

        const [existingUser] = await db.execute<any[]>(
            "SELECT user_id FROM User WHERE emailHashed = ?",
            [emailHash]
        );

        let user_id;

        if (existingUser.length > 0) {
            return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
        } else {
            const [userIdResult] = await db.execute<any[]>("SELECT UUID() AS uuid");
            user_id = userIdResult[0].uuid;

            const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
            const hashedPassword = await bcrypt.hash(password, 10);

            const emailEncrypted = JSON.stringify(
                await encryptData(email, process.env.ENCRYPTION_SECRET!)
            );


            await db.execute(
                `INSERT INTO User
                 (user_id, email, emailHashed, password, userType, createdAt, updatedAt, emailVerified, timezone)
                 VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), ?, ?)`,
                [user_id, emailEncrypted, emailHash, hashedPassword, userType, 0, timezone]
            );

            if (role === "tenant") {
                await db.execute(`INSERT INTO Tenant (user_id) VALUES (?)`, [user_id]);
            } else if (role === "landlord") {
                console.log("Inserting into Landlord table...");
                await db.execute(`INSERT INTO Landlord (user_id) VALUES (?)`, [user_id]);
            }


            await db.execute(
                `INSERT INTO ActivityLog (user_id, action, timestamp) 
         VALUES (?, ?, NOW())`,
                [user_id, "User registered"]
            );

            const otp = generateOTP();
            const { local_expiry, timezone: tz } = await storeOTP(db, user_id, otp);
            await sendOtpEmail(email, otp, local_expiry, tz);
        }

        // Generate JWT
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const token = await new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(secret);

        console.log("Generated JWT Token for User ID:", user_id);

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
        console.error("Error:", error);
        return NextResponse.json({ message: "Database Server Error" }, { status: 500 });
    } finally {
        await db.end();
    }
}



// --------------------- OTP HELPERS ------------------------
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

async function storeOTP(connection: mysql.Connection, user_id: string, otp: string) {
    console.log(`Storing OTP for User ID: ${user_id}, OTP: ${otp}`);

    // Remove old tokens
    await connection.execute(
        `DELETE FROM UserToken WHERE user_id = ? AND token_type = 'email_verification'`,
        [user_id]
    );

    // Insert new token in UTC
    await connection.execute(
        `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
         VALUES (?, 'email_verification', ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))`,
        [user_id, otp]
    );

    // 🔹 Fetch expiry time converted to user's saved timezone
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

    const { local_expiry, timezone } = rows[0];
    console.log(`OTP ${otp} expires at ${local_expiry} (${timezone})`);

    return { local_expiry, timezone };
}

async function sendOtpEmail(toEmail: string, otp: string, localExpiry: string, timezone: string) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Upkyp Registration: Verify your account',
        text: `Your OTP is: ${otp}.
It expires at ${localExpiry} (${timezone}).`,
    });

    console.log(`OTP sent to ${toEmail}, expires at ${localExpiry} (${timezone})`);
}

