import bcrypt from "bcrypt";
import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
        return res.status(400).json({ message: "Reset token and new password are required." });
    }

    try {
        // Check if the reset token exists in the database
        const [user] = await db.execute(
            "SELECT * FROM User WHERE resetToken = ? AND resetTokenExpiry > NOW()",
            [resetToken]
        );

        const email = user[0].email;

        if (!user) {
            return res.status(404).json({ message: "Invalid or expired reset token." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Updating password for user:", user.userID);
        console.log("Hashed password:", hashedPassword);
        // Update the password in the database and clear the reset token
        await db.execute(
            "UPDATE User SET password = ?, resetToken = 0, resetTokenExpiry = 0 WHERE email = ?",
            [hashedPassword, email]
        );

        res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
        console.error("Error during password reset:", error);
        res.status(500).json({ message: "An error occurred. Please try again later." });
    }
}

