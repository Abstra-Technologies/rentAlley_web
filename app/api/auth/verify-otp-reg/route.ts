import mysql from "mysql2/promise";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

const dbConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
};

export async function POST(req: NextRequest) {
    /* ======================================================
       COOKIE + JWT VALIDATION (USER ID ONLY)
    ====================================================== */
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json(
            { message: "Unauthorized: No session found." },
            { status: 401 }
        );
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing");
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    let user_id: string;

    try {
        const { payload } = await jwtVerify(token, secret);
        user_id = payload.user_id as string;

        if (!user_id) {
            return NextResponse.json(
                { message: "Invalid session token" },
                { status: 401 }
            );
        }
    } catch {
        return NextResponse.json(
            { message: "Invalid or expired session" },
            { status: 401 }
        );
    }

    /* ======================================================
       REQUEST BODY
    ====================================================== */
    const { otp } = await req.json();

    if (!otp || !/^\d{6}$/.test(otp)) {
        return NextResponse.json(
            { message: "OTP must be a 6-digit number" },
            { status: 400 }
        );
    }

    /* ======================================================
       DATABASE
    ====================================================== */
    const connection = await mysql.createConnection(dbConfig);

    try {
        await connection.beginTransaction();

        const [otpRows] = await connection.execute<any[]>(
            `
      SELECT
        t.expires_at,
        u.timezone,
        u.userType
      FROM UserToken t
      JOIN User u ON u.user_id = t.user_id
      WHERE t.user_id = ?
        AND t.token = ?
        AND t.token_type = 'email_verification'
        AND t.expires_at > UTC_TIMESTAMP()
        AND t.used_at IS NULL
      LIMIT 1
      `,
            [user_id, otp]
        );

        console.log("[OTP VERIFY] rows:", otpRows.length);

        if (otpRows.length === 0) {
            await connection.rollback();
            return NextResponse.json(
                { message: "Invalid or expired OTP" },
                { status: 400 }
            );
        }

        /* ======================================================
           AUTHORITATIVE VALUES (FROM DB)
        ====================================================== */
        const {
            expires_at,
            timezone,
            userType,
        } = otpRows[0];

        console.log("[OTP VERIFY] userType from DB:", userType);

        if (!userType) {
            await connection.rollback();
            return NextResponse.json(
                { message: "User role missing. Please contact support." },
                { status: 400 }
            );
        }

        /* ======================================================
           UPDATE TOKEN + USER
        ====================================================== */
        await connection.execute(
            `
      UPDATE UserToken
      SET used_at = UTC_TIMESTAMP()
      WHERE user_id = ? AND token = ?
      `,
            [user_id, otp]
        );

        await connection.execute(
            `
      UPDATE User
      SET emailVerified = 1
      WHERE user_id = ?
      `,
            [user_id]
        );

        /* ======================================================
           LOCAL EXPIRY (FOR UI)
        ====================================================== */
        const [expiryRows] = await connection.execute<any[]>(
            `
      SELECT CONVERT_TZ(?, '+00:00', ?) AS local_expiry
      `,
            [expires_at, timezone || "UTC"]
        );

        /* ======================================================
           SIGN NEW JWT (WITH ROLE)
        ====================================================== */
        const newToken = await new SignJWT({
            user_id,
            userType, // ✅ CRITICAL
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(secret);

        await connection.commit();

        /* ======================================================
           RESPONSE
        ====================================================== */
        const response = NextResponse.json({
            message: "OTP verified successfully!",
            userType,
            expiresAt: expiryRows?.[0]?.local_expiry || null,
            timezone: timezone || "UTC",
        });

        response.cookies.set("token", newToken, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 2 * 60 * 60, // 2 hours
        });

        return response;

    } catch (err) {
        await connection.rollback();
        console.error("[OTP VERIFY ERROR]:", err);

        return NextResponse.json(
            { message: "Failed to verify OTP" },
            { status: 500 }
        );
    } finally {
        await connection.end();
    }
}
