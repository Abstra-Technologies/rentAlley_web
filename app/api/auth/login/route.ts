import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

/* =====================================================
   USER LOGIN API (NON-BLOCKING + OPTIMIZED)
===================================================== */
export async function POST(req: NextRequest) {
    try {
        const { email, password, captchaToken, rememberMe, callbackUrl } =
            await req.json();

        if (!email || !password || !captchaToken) {
            return NextResponse.json(
                { error: "Email, password, and captcha are required" },
                { status: 400 }
            );
        }

        const safeCallbackUrl =
            typeof callbackUrl === "string" && callbackUrl.startsWith("/")
                ? callbackUrl
                : null;

        /* =====================================================
           CAPTCHA VERIFY
        ===================================================== */
        const captchaRes = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    secret: process.env.RECAPTCHA_SECRET_KEY!,
                    response: captchaToken,
                }),
            }
        );

        const captchaData = await captchaRes.json();

        if (!captchaData.success) {
            return NextResponse.json(
                { error: "CAPTCHA verification failed" },
                { status: 403 }
            );
        }

        /* =====================================================
           LOOKUP USER
        ===================================================== */
        const emailHash = crypto
            .createHash("sha256")
            .update(email)
            .digest("hex");

        const [users]: any[] = await db.query(
            "SELECT * FROM User WHERE emailHashed = ? LIMIT 1",
            [emailHash]
        );

        if (!users.length) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const user = users[0];

        if (user.google_id) {
            return NextResponse.json(
                { error: "Please login using Google Sign-In" },
                { status: 403 }
            );
        }

        if (user.status !== "active") {
            return NextResponse.json(
                { error: `Your account is ${user.status}. Contact support.` },
                { status: 403 }
            );
        }

        /* =====================================================
           PASSWORD CHECK
        ===================================================== */
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        /* =====================================================
           DISPLAY NAME
        ===================================================== */
        let displayName = email;

        try {
            if (user.companyName) {
                displayName = user.companyName;
            } else if (user.firstName && user.lastName) {
                const first = await decryptData(
                    JSON.parse(user.firstName),
                    process.env.ENCRYPTION_SECRET!
                );
                const last = await decryptData(
                    JSON.parse(user.lastName),
                    process.env.ENCRYPTION_SECRET!
                );
                displayName = `${first} ${last}`;
            }
        } catch {}

        /* =====================================================
           TOKEN SETTINGS
        ===================================================== */
        const jwtExpiry = rememberMe ? "7d" : "2h";
        const cookieAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 2;
        const isProd = process.env.NODE_ENV === "production";

        /* =====================================================
           2FA HANDLING
        ===================================================== */
        if (user.is_2fa_enabled) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            await db.query(
                `
                INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
                VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
                ON DUPLICATE KEY UPDATE
                    token = VALUES(token),
                    created_at = NOW(),
                    expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
                `,
                [user.user_id, otp]
            );

            // 🚀 Non-blocking email
            sendOtpEmail(email, otp).catch(err =>
                console.error("2FA email failed:", err)
            );

            const twoFaUrl = new URL("/pages/auth/twofactor", req.url);
            twoFaUrl.searchParams.set("user_id", user.user_id);

            if (safeCallbackUrl) {
                twoFaUrl.searchParams.set("callbackUrl", safeCallbackUrl);
            }

            const redirect = NextResponse.redirect(twoFaUrl, { status: 303 });

            redirect.cookies.set("pending_2fa", "true", {
                httpOnly: true,
                secure: isProd,
                sameSite: "lax",
                path: "/",
            });

            return redirect;
        }

        /* =====================================================
           JWT GENERATION (USER ONLY)
        ===================================================== */
        const token = await new SignJWT({
            user_id: user.user_id,
            userType: user.userType,
            emailVerified: user.emailVerified,
            status: user.status,
            displayName,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(jwtExpiry)
            .setSubject(user.user_id)
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

        /* =====================================================
           REDIRECT DESTINATION
        ===================================================== */
        const fallbackRedirect =
            user.userType === "tenant"
                ? "/pages/tenant/feeds"
                : "/pages/landlord/dashboard";

        const finalRedirect = safeCallbackUrl || fallbackRedirect;

        const response = NextResponse.redirect(
            new URL(finalRedirect, req.url),
            { status: 303 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            maxAge: cookieAge,
            path: "/",
        });

        /* =====================================================
           NON-BLOCKING AUDIT LOGGING
        ===================================================== */
        db.query(
            "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
            [user.user_id, "User logged in"]
        ).catch(err =>
            console.error("Activity log failed:", err)
        );

        db.query(
            "UPDATE User SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            [user.user_id]
        ).catch(err =>
            console.error("Last login update failed:", err)
        );

        return response;

    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/* =====================================================
   NON-BLOCKING EMAIL SENDER
===================================================== */
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
        subject: "Your 2FA Verification Code",
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    });
}
