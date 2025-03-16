import { db } from "../../../lib/db";
import nodemailer from "nodemailer";

export default async function SuspendAccount(req, res) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ error: "Method Not Allowed. Use POST." });
    }
    try {
        const { userId, message, email } = req.body;
        if (!userId) {
            return res
                .status(400)
                .json({ error: "Missing required field: userId." });
        }
        const [result] = await db.query(
            "UPDATE User SET is_active = ? WHERE user_id = ?",
            [0, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        await sendOtpEmail(email, message);
        return res.status(200).json({
            message: "Account suspended successfully."
        });
    } catch (error) {
        console.error("Error handling suspend account request:", error);
        return res.status(500).json({
            error: "Internal Server Error. Please try again later."
        });
    }
}

async function sendOtpEmail(toEmail, message) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: {
            rejectUnauthorized: false,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Account Suspended',
        text: `Your account is: ${message}.`,
    });

    console.log(`OTP sent to ${toEmail}`);
}
