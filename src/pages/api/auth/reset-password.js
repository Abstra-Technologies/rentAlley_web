import bcrypt from "bcrypt";
import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Invalid request data.' });
    }

    try {
        // ✅ Check if reset token is valid and not expired
        const [tokens] = await db.execute(
            `SELECT user_id FROM UserToken 
             WHERE token = ? AND expires_at > NOW()`,
            [resetToken]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        const userId = tokens[0].user_id;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // ✅ Update password
        await db.execute("UPDATE User SET password = ? WHERE user_id = ?", [hashedPassword, userId]);

        // ✅ Delete the reset token after use
        await db.execute("DELETE FROM UserToken WHERE user_id = ?", [userId]);

        res.status(200).json({ message: "Password reset successfully." });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "An error occurred. Please try again later." });
    }
}
