import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import crypto from "crypto";

/* =====================================================
   🔧 CONSTANTS
===================================================== */

const JWT_SECRET = process.env.JWT_SECRET!;
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET!;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY!;
const IS_PROD = process.env.NODE_ENV === "production";

const DEFAULT_JWT_EXPIRY = "2h";
const REMEMBER_JWT_EXPIRY = "7d";

const DEFAULT_COOKIE_AGE = 60 * 60 * 2;        // 2 hours
const REMEMBER_COOKIE_AGE = 60 * 60 * 24 * 7;  // 7 days

/* =====================================================
   🚀 USER LOGIN API (BETA VERSION)
===================================================== */
export async function POST(req: NextRequest) {
    try {
        const { email, password, captchaToken, rememberMe, callbackUrl } =
            await req.json();

        /* ================= VALIDATION ================= */
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

        /* ================= CAPTCHA VERIFY ================= */
        const captchaRes = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    secret: RECAPTCHA_SECRET,
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

        /* ================= USER LOOKUP ================= */
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

        /* ================= PASSWORD CHECK ================= */
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        /* ================= DISPLAY NAME ================= */
        let displayName = email;

        try {
            if (user.companyName) {
                displayName = user.companyName;
            } else if (user.firstName && user.lastName) {
                const first = await decryptData(
                    JSON.parse(user.firstName),
                    ENCRYPTION_SECRET
                );
                const last = await decryptData(
                    JSON.parse(user.lastName),
                    ENCRYPTION_SECRET
                );
                displayName = `${first} ${last}`;
            }
        } catch {
            displayName = email;
        }

        /* ================= TOKEN CONFIG ================= */
        const jwtExpiry = rememberMe
            ? REMEMBER_JWT_EXPIRY
            : DEFAULT_JWT_EXPIRY;

        const cookieAge = rememberMe
            ? REMEMBER_COOKIE_AGE
            : DEFAULT_COOKIE_AGE;

        /* ================= JWT GENERATION ================= */
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
            .sign(new TextEncoder().encode(JWT_SECRET));

        /* ================= REDIRECT LOGIC ================= */
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
            secure: IS_PROD,
            sameSite: "lax",
            maxAge: cookieAge,
            path: "/",
        });

        /* ================= NON-BLOCKING LOGGING ================= */
        db.query(
            "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
            [user.user_id, "User logged in"]
        ).catch(() => {});

        db.query(
            "UPDATE User SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            [user.user_id]
        ).catch(() => {});

        return response;

    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
