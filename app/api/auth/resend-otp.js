import { db } from "../../../lib/db";
import { getCookie } from "cookies-next";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { jwtVerify } from "jose";
import { decryptData } from "../../../crypto/encrypt";

export default async function resendOtp(req, res) {
    try {
        console.log("🔍 [Resend OTP] Request received.");

        const token = getCookie("token", { req, res });

        if (!token) {
            console.error("[Resend OTP] No valid token found.");
            return res.status(401).json({ error: "Unauthorized. No valid session token found." });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;

        try {
            const verifiedToken = await jwtVerify(token, secret);
            payload = verifiedToken.payload;
        } catch (err) {
            console.error("[Resend OTP] Invalid JWT token.");
            return res.status(401).json({ error: "Invalid token. Please log in again." });
        }

        const user_id = payload?.user_id;

        if (!user_id) {
            console.error("[Resend OTP] Invalid JWT payload.");
            return res.status(400).json({ error: "Invalid session data." });
        }

        console.log(`[Resend OTP] User verified: ${user_id}`);

        const [user] = await db.execute(
            "SELECT email FROM User WHERE user_id = ?",
            [user_id]
        );

        if (!user || user.length === 0) {
            console.error("[Resend OTP] User email not found.");
            return res.status(404).json({ error: "User not found." });
        }

        let email = user[0].email;

        try {
            email = await decryptData(JSON.parse(email), process.env.ENCRYPTION_SECRET);
            console.log("🔓 [Resend OTP] Decrypted Email:", email);
        } catch (err) {
            console.warn("⚠ [Resend OTP] Email decryption failed, using stored value.", err);
            return res.status(500).json({ error: "Email decryption failed. Please contact support." });
        }

        const newOtp = crypto.randomInt(100000, 999999).toString();
        console.log(`[Resend OTP] New OTP: ${newOtp}`);

        await db.execute(
            `INSERT INTO UserToken (user_id, token_type, token, expires_at)
             VALUES (?, 'email_verification', ?, NOW() + INTERVAL 10 MINUTE)
             ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = NOW() + INTERVAL 10 MINUTE`,
            [user_id, newOtp]
        );

        console.log(`[Resend OTP] OTP stored in database for user: ${user_id}`);

        await sendOtpEmail(email, newOtp);

        console.log(`[Resend OTP] OTP ${newOtp} sent to ${email}`);

        res.status(200).json({ message: "New OTP sent. Check your email." });

    } catch (error) {
        console.error("[Resend OTP] Error:", error);
        res.status(500).json({ error: "Failed to resend OTP. Please try again." });
    }
}

async function sendOtpEmail(toEmail, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
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
            subject: "Your New OTP for Verification",
            text: `Your new OTP is: ${otp}. It expires in 10 minutes.`,
        });

        console.log(`[Email] OTP sent to ${toEmail}`);
    } catch (error) {
        console.error("[Email] Failed to send OTP:", error);
    }
}
