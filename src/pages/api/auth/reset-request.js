import crypto from "crypto";
import nodemailer from "nodemailer";
import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        // ✅ Hash the email instead of decrypting
        const emailHash = crypto.createHash("sha256").update(email).digest("hex");

        // ✅ Lookup user using hashed email
        const [users] = await db.query("SELECT user_id, email FROM User WHERE emailHashed = ?", [emailHash]);

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = users[0];
        const userId = user.user_id;

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1-hour expiry

        console.log("Generated Reset Token:", resetToken);
        console.log("Token Expiry:", resetTokenExpiry);

        // ✅ Delete any existing reset tokens before inserting a new one
        await db.execute(
            "DELETE FROM UserToken WHERE user_id = ?",
            [userId]
        );

        // ✅ Insert new password reset token into PasswordReset table
        await db.execute(
            `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
             VALUES (?, 'password_reset', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
            [userId, resetToken]
        );
        return res.status(200).json({
            message: "User found. Proceed to reset password.",
            resetToken
        });

    } catch (error) {
        console.error("Error during forgot password process:", error);
        res.status(500).json({ message: "An error occurred. Please try again later." });
    }
}
