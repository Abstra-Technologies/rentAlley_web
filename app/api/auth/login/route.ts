import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import nodeCrypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { email, password, captchaToken, rememberMe } = body;

    if (!email || !password || !captchaToken) {
        return NextResponse.json(
            { error: "Email, password, and captcha are required" },
            { status: 400 }
        );
    }

    const captchaSecret = process.env.RECAPTCHA_SECRET_KEY!;
    const captchaURL = "https://www.google.com/recaptcha/api/siteverify";

    // CAPTCHA VERIFY
    const params = new URLSearchParams();
    params.append("secret", captchaSecret);
    params.append("response", captchaToken);

    const captchaRes = await fetch(captchaURL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
    });

    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
        return NextResponse.json(
            { error: "CAPTCHA verification failed" },
            { status: 403 }
        );
    }

    // USER LOOKUP
    const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");

    let users: any[] = [];
    let retries = 3;

    while (retries > 0) {
        try {
            const [result]: any[] = await db.query(
                "SELECT * FROM User WHERE emailHashed = ?",
                [emailHash]
            );
            users = result;
            break;
        } catch (e: any) {
            retries--;
            if (e.code === "ECONNRESET" && retries > 0) {
                await new Promise((res) => setTimeout(res, 1000));
                continue;
            }
            throw e;
        }
    }

    if (!users.length) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = users[0];

    if (user.google_id) {
        return NextResponse.json(
            { error: "Please login using Google Sign-In" },
            { status: 403 }
        );
    }

    if (user.status === "deactivated") {
        return NextResponse.json(
            { error: "Your account is deactivated. Contact support." },
            { status: 403 }
        );
    }

    if (user.status === "suspended") {
        return NextResponse.json(
            { error: "Your account is suspended." },
            { status: 403 }
        );
    }

    // PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
        );
    }

    // DISPLAY NAME
    let displayName = email;
    if (user.companyName) {
        displayName = user.companyName;
    } else if (user.firstName && user.lastName) {
        try {
            const firstName = await decryptData(
                JSON.parse(user.firstName),
                process.env.ENCRYPTION_SECRET!
            );
            const lastName = await decryptData(
                JSON.parse(user.lastName),
                process.env.ENCRYPTION_SECRET!
            );
            displayName = `${firstName} ${lastName}`;
        } catch {}
    }

    // JWT + REMEMBER ME
    const jwtExpiry = rememberMe ? "7d" : "2h";
    const cookieAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 2;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({
        user_id: user.user_id,
        userType: user.userType,
        displayName,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(jwtExpiry)
        .setIssuedAt()
        .setSubject(user.user_id)
        .sign(secret);

    // DETERMINE REDIRECT URL
    let redirectUrl = "/pages/auth/login";
    if (user.userType === "tenant") redirectUrl = "/pages/tenant/feeds";
    if (user.userType === "landlord") redirectUrl = "/pages/landlord/dashboard";
    if (user.userType === "admin") redirectUrl = "/pages/admin/dashboard";

    const isProd = process.env.NODE_ENV === "production";

    // HANDLE 2FA BEFORE REDIRECT
    if (user.is_2fa_enabled) {
        const otp = Math.floor(100000 + Math.random() * 900000);

        await db.query("SET time_zone = '+08:00'");
        await db.query(
            `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
       VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
       ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`,
            [user.user_id, otp]
        );

        await sendOtpEmail(email, otp.toString());

        // 2FA redirect
        const redirect = NextResponse.redirect(
            new URL(`/pages/auth/twofactor?user_id=${user.user_id}`, req.url),
            { status: 303 }
        );

        redirect.cookies.set("pending_2fa", "true", {
            httpOnly: true,
            path: "/",
        });

        return redirect;
    }

    // NORMAL LOGIN REDIRECT
    const response = NextResponse.redirect(new URL(redirectUrl, req.url), {
        status: 303,
    });

    response.cookies.set("token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: cookieAge,
        path: "/",
    });

    // ACTIVITY LOG
    await db.query(
        "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, ?)",
        [user.user_id, "User logged in", new Date().toISOString()]
    );

    return response;
}

async function sendOtpEmail(email: string, otp: string) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER!,
            pass: process.env.EMAIL_PASS!,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER!,
        to: email,
        subject: "Your Hestia 2FA OTP Code",
        text: `Your OTP code is: ${otp}\nIt will expire in 10 minutes.`,
    });
}
