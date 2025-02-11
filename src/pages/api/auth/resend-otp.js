import { db } from "../../lib/db";
import { getCookie } from "cookies-next";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { jwtVerify } from "jose";
import { decryptData } from "../../crypto/encrypt"; // Import decryption function

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        console.log("🔍 [Resend OTP] Request received.");

        // ✅ Step 1: Get token from cookies
        const token = await getCookie('token', { req, res });

        if (!token) {
            console.error("❌ [Resend OTP] No valid token found.");
            return res.status(401).json({ message: "Unauthorized. Please log in again." });
        }

        // ✅ Step 2: Verify JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const user_id = payload.user_id;

        if (!user_id) {
            console.error("❌ [Resend OTP] Invalid JWT payload.");
            return res.status(400).json({ message: "Invalid session data." });
        }

        console.log(`✅ [Resend OTP] User verified: ${user_id}`);

        // ✅ Step 3: Retrieve user's email (decrypt if necessary)
        const [user] = await db.query(`SELECT email FROM User WHERE user_id = ?`, [user_id]);

        if (!user || user.length === 0) {
            console.error("❌ [Resend OTP] User email not found.");
            return res.status(404).json({ message: "User email not found." });
        }

        let email = user[0].email;

        // If email is encrypted, decrypt it
        try {
            email = await decryptData(JSON.parse(email), process.env.ENCRYPTION_SECRET);
            console.log("🔓 [Resend OTP] Decrypted Email:", email);
        } catch (err) {
            console.warn("⚠ [Resend OTP] Email is not encrypted or decryption failed, using stored value.");
        }

        // ✅ Step 4: Generate a new OTP
        const newOtp = crypto.randomInt(100000, 999999).toString();
        console.log(`🔑 [Resend OTP] New OTP: ${newOtp}`);

        // ✅ Step 5: Update existing OTP or insert new one
        await db.query(
            `INSERT INTO UserToken (user_id, token_type, token, expires_at)
             VALUES (?, 'email_verification', ?, NOW() + INTERVAL 10 MINUTE)
             ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = NOW() + INTERVAL 10 MINUTE`,
            [user_id, newOtp]
        );

        console.log(`✅ [Resend OTP] OTP stored in database for user: ${user_id}`);

        // ✅ Step 6: Send OTP email
        await sendOtpEmail(email, newOtp);

        console.log(`✅ [Resend OTP] OTP ${newOtp} sent to ${email}`);

        res.status(200).json({ message: "New OTP sent. Check your email." });

    } catch (error) {
        console.error("❌ [Resend OTP] Error:", error);
        res.status(500).json({ message: "Failed to resend OTP. Please try again." });
    }
}

// ✅ Function to send OTP email securely
async function sendOtpEmail(toEmail, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false, // Disable certificate validation (not recommended for production)
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: "Your New OTP for Verification",
            text: `Your new OTP is: ${otp}. It expires in 10 minutes.`,
        });

        console.log(`✅ [Email] OTP sent to ${toEmail}`);
    } catch (error) {
        console.error("❌ [Email] Failed to send OTP:", error);
    }
}
