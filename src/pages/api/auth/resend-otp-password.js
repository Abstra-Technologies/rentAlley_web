import nodeCrypto from "crypto";
import {db} from "../../../lib/db";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required." });
        }

        const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");

        const [user] = await db.query(
            "SELECT user_id FROM User WHERE emailHashed = ?",
            [emailHash]
        );

        if (!user.length) {
            return res.status(404).json({ error: "User not found." });
        }

        const userId = user[0].user_id;

        //Delete old OTPs to prevent multiple valid OTPs
        await db.query("DELETE FROM UserToken WHERE user_id = ? AND token_type = 'password_reset'", [userId]);

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

        const nowUTC8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        const expiresAtUTC8 = new Date(expiresAt.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

        await db.query("SET time_zone = '+08:00'");

        await db.query(
            `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
    VALUES (?, 'password_reset', ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      token = VALUES(token), 
      created_at = VALUES(created_at), 
      expires_at = VALUES(expires_at)`,
            [userId, newOtp, nowUTC8, expiresAtUTC8]
        );

        await sendOtpEmail(email, newOtp);

        return res.status(200).json({ message: "New OTP has been sent to your email." });

    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function sendOtpEmail(toEmail, newOtp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: {
            rejectUnauthorized: false,
        },
    });
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: toEmail, subject: "Rentahan: Reset Password OTP", text: `Your OTP is: ${newOtp}` });
}