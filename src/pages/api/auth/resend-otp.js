import { db } from "../../../lib/db";
import { getCookie } from "cookies-next";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { jwtVerify } from "jose";
import { decryptData } from "../../../crypto/encrypt";

export default async function resendOtp(req, res) {

    try {
        console.log("🔍 [Resend OTP] Request received.");

        const token = await getCookie('token', { req, res });

        if (!token) {
            console.error("[Resend OTP] No valid token found.");
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const user_id = payload.user_id;

        if (!user_id) {
            console.error("[Resend OTP] Invalid JWT payload.");
        }

        console.log(`[Resend OTP] User verified: ${user_id}`);

        const [user] = await db.query(`SELECT email FROM User WHERE user_id = ?`, [user_id]);

        if (!user || user.length === 0) {
            console.error("[Resend OTP] User email not found.");
        }

        let email = user[0].email;

        try {
            email = await decryptData(JSON.parse(email), process.env.ENCRYPTION_SECRET);
            console.log("🔓 [Resend OTP] Decrypted Email:", email);
        } catch (err) {
            console.warn("⚠ [Resend OTP] Email is not encrypted or decryption failed, using stored value.", err);
        }

        const newOtp = crypto.randomInt(100000, 999999).toString();
        console.log(`🔑 [Resend OTP] New OTP: ${newOtp}`);

        await db.query(
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
        res.status(500).json({ message: "Failed to resend OTP. Please try again." });
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
