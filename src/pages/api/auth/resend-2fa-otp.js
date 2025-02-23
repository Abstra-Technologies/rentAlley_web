import { db } from "../../lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { decryptData } from "../../crypto/encrypt";

// since 2fa is still not under a session.
export default async function resend2faOtp(req, res) {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ error: "Missing user_id." });
        }

        const [users] = await db.query(
            `SELECT email FROM User WHERE user_id = ?`,
            [user_id]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        let email = users[0].email;
        try {
            email = await decryptData(JSON.parse(email), process.env.ENCRYPTION_SECRET);
        } catch (error) {
            console.error("[Resend OTP] Decryption failed for email.");
        }

        const newOtp = crypto.randomInt(100000, 999999).toString();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

        const nowUTC8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        const expiresAtUTC8 = new Date(expiresAt.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        await db.query("SET time_zone = '+08:00'");

        const [result] = await db.query(
            `UPDATE UserToken
             SET token = ?,
                 created_at = CONVERT_TZ(NOW(), 'SYSTEM', 'Asia/Manila'),
                 expires_at = CONVERT_TZ(DATE_ADD(NOW(), INTERVAL 10 MINUTE), 'SYSTEM', 'Asia/Manila')
             WHERE user_id = ? AND token_type = '2fa'`,
            [newOtp,user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: "No OTP record found to update." });
        }

        await sendOtpEmail(email, newOtp);
        return res.status(200).json({ message: "OTP resent successfully." });

    } catch (error) {

        console.error("Error during resend2faOtp:", error);
    }
}

async function sendOtpEmail(email, otp) {
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

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Rentahan 2FA OTP Code",
        text: `Your OTP Code is: ${otp}\nThis code will expire in 10 minutes.`,
    };

    return  transporter.sendMail(mailOptions);
}
