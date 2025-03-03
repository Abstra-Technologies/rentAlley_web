import crypto from "crypto";
import nodemailer from "nodemailer";
import { db } from "../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        // compare the hash value.
        const emailHash = crypto.createHash("sha256").update(email).digest("hex");
        // Lookup user using hashed email
        const [users] = await db.query("SELECT user_id, email, google_id FROM User WHERE emailHashed = ?", [emailHash]);

        const user = users[0];

        if (user.google_id) {
            return res.status(403).json({
                error: "Your account is linked with Google. Please log in using Google. "
            });
        }

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

        const nowUTC8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        const expiresAtUTC8 = new Date(expiresAt.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

        await db.query("SET time_zone = '+08:00'");

        await db.query(
            "INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at) \n" +
            "VALUES (?, 'password_reset', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))\n" +
            "ON DUPLICATE KEY UPDATE \n" +
            "  token = VALUES(token), \n" +
            "  created_at = NOW(), \n" +
            "  expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)",
            [users[0].user_id, otp, nowUTC8, expiresAtUTC8]
        );


        await sendOtpEmail(email, otp);
        res.status(200).json({ message: "OTP sent to your email." });


    } catch (error) {
        console.error("Error during forgot password process:", error);
        res.status(500).json({ message: "An error occurred. Please try again later." });
    }
}

async function sendOtpEmail(toEmail, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: {
            rejectUnauthorized: false, // Disable certificate validation (not recommended for production)
        },
    });
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: toEmail, subject: "Rentahan: Reset Password OTP", text: `Your OTP is: ${otp}` });
}