import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";
import { SignJWT } from "jose";
import { Resend } from "resend";

import { encryptData } from "@/crypto/encrypt";
import { generateLandlordId, generateTenantId } from "@/utils/id_generator";
import { generateNameHash, generateNameTokens } from "@/utils/nameHash";
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
    timezone: string,
    registeredAt: string
) {
    const title = "[Upkyp Registration]: Verify your Upkyp account";

    const formattedExpiry = expiry.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    await resend.emails.send({
        from: "Upkyp Registration <hello@upkyp.com>",
        to: [email],
        subject: title,
        react: EmailTemplate({
            title,
            firstName: firstName || "there",
            otp,
            expiry: formattedExpiry,
            timezone,
            registeredAt,
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
async function storeOTP(db: mysql.Connection, user_id: string, otp: string) {
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
        `
    SELECT
      CONVERT_TZ(t.expires_at, '+00:00', u.timezone) AS local_expiry,
      u.timezone
    FROM UserToken t
    JOIN User u ON u.user_id = t.user_id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
    LIMIT 1
    `,
        [user_id]
    );

    return rows[0];
}

/* --------------------------------------------------
   ROLE IDS
-------------------------------------------------- */
async function generateUniqueTenantId(db: mysql.Connection) {
    let id = "";
    let exists = true;

    while (exists) {
        id = generateTenantId();
        const [rows] = await db.execute<any[]>(
            "SELECT tenant_id FROM Tenant WHERE tenant_id = ? LIMIT 1",
            [id]
        );
        exists = rows.length > 0;
    }
    return id;
}

async function generateUniqueLandlordId(db: mysql.Connection) {
    let id = "";
    let exists = true;

    while (exists) {
        id = generateLandlordId();
        const [rows] = await db.execute<any[]>(
            "SELECT landlord_id FROM Landlord WHERE landlord_id = ? LIMIT 1",
            [id]
        );
        exists = rows.length > 0;
    }
    return id;
}

/* --------------------------------------------------
   API
-------------------------------------------------- */
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
        return NextResponse.json(
            { error: "Code and state are required" },
            { status: 400 }
        );
    }

    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        REDIRECT_URI,
        ENCRYPTION_SECRET,
        JWT_SECRET,
    } = process.env;

    const { userType, timezone = "UTC" } =
    JSON.parse(decodeURIComponent(state)) || {};

    const role = userType?.trim().toLowerCase() || "tenant";

    const db = await mysql.createConnection(dbConfig);
    await db.execute("SET time_zone = '+08:00'");

    try {
        await db.beginTransaction();

        /* ---------- GOOGLE TOKEN ---------- */
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: REDIRECT_URI!,
                grant_type: "authorization_code",
            }),
        });

        const { access_token } = await tokenRes.json();
        if (!access_token) throw new Error("Google OAuth failed");

        /* ---------- GOOGLE USER ---------- */
        const userInfoRes = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const userInfo = await userInfoRes.json();

        const googleId = userInfo.sub;
        const email = userInfo.email?.toLowerCase();
        const firstName = userInfo.given_name || "";
        const lastName = userInfo.family_name || "";
        const profilePicture = userInfo.picture || null;

        if (!googleId || !email) {
            throw new Error("Missing Google user info");
        }

        const emailHash = crypto
            .createHash("sha256")
            .update(email)
            .digest("hex");

        const nameHashed = generateNameHash(firstName, lastName);
        const nameTokens = generateNameTokens(firstName, lastName);

        /* ---------- USER UPSERT ---------- */
        const [existing] = await db.execute<any[]>(
            `SELECT user_id FROM User
       WHERE emailHashed = ? OR google_id = ?
       LIMIT 1`,
            [emailHash, googleId]
        );

        let user_id: string;

        if (existing.length) {
            user_id = existing[0].user_id;

            /* 🔁 BACKFILL HASHES IF MISSING */
            await db.execute(
                `
        UPDATE User
        SET
          nameHashed = COALESCE(nameHashed, ?),
          nameTokens = COALESCE(nameTokens, ?)
        WHERE user_id = ?
        `,
                [nameHashed, nameTokens, user_id]
            );
        } else {
            const [[{ uuid }]] = await db.execute<any[]>("SELECT UUID() AS uuid");
            user_id = uuid;

            await db.execute(
                `INSERT INTO User
         (user_id, email, emailHashed, google_id, userType,
          emailVerified, timezone,
          firstName, lastName, profilePicture,
          nameHashed, nameTokens,
          createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
                [
                    user_id,
                    JSON.stringify(await encryptData(email, ENCRYPTION_SECRET!)),
                    emailHash,
                    googleId,
                    role,
                    timezone,
                    firstName
                        ? JSON.stringify(await encryptData(firstName, ENCRYPTION_SECRET!))
                        : null,
                    lastName
                        ? JSON.stringify(await encryptData(lastName, ENCRYPTION_SECRET!))
                        : null,
                    profilePicture
                        ? JSON.stringify(await encryptData(profilePicture, ENCRYPTION_SECRET!))
                        : null,
                    nameHashed,
                    nameTokens,
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
        }

        /* ---------- OTP + SESSION ---------- */
        const otp = generateOTP();
        const { local_expiry, timezone: tz } = await storeOTP(db, user_id, otp);

        const registeredAt = new Date().toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: tz,
        });

        await sendOtpEmail(
            email,
            firstName,
            otp,
            local_expiry,
            tz,
            registeredAt
        );

        const sessionToken = await new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(new TextEncoder().encode(JWT_SECRET!));

        await db.commit();

        const response = NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_BASE_URL}/pages/auth/verify-email`
        );

        response.cookies.set("token", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 2 * 60 * 60,
        });

        return response;
    } catch (err) {
        await db.rollback();
        console.error("❌ Google Signup Error:", err);
        return NextResponse.json(
            { error: "Google signup failed" },
            { status: 500 }
        );
    } finally {
        await db.end();
    }
}
