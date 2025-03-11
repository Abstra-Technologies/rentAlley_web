import { jwtVerify } from "jose";
import mysql from "mysql2/promise";
import {decryptData} from "../../../crypto/encrypt";
import bcrypt from "bcrypt";


const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export default async function changePassword(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const token = req.cookies.token;

    if (!token) {
        console.error("Token not found in cookies.");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try{
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.user_id;


        if (!userId) {
            console.error("❌ [Change Password] Invalid JWT payload.");
            return res.status(400).json({ message: "Invalid session data." });
        }

        const { currentPassword, newPassword } = req.body;


        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both current and new passwords are required." });
        }

        // Fetch the user's stored hashed password
        const [rows] = await db.query("SELECT password FROM User WHERE user_id = ?", [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const storedPassword = rows[0].password;

        // Check if the current password matches
        const passwordMatch = await bcrypt.compare(currentPassword, storedPassword);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await db.query("UPDATE User SET password = ? WHERE user_id = ?", [hashedNewPassword, userId]);
        res.setHeader("Set-Cookie", `token=; HttpOnly; Path=/; Max-Age=0;`);
        console.log("✅ [Change Password] Password updated successfully for user:", userId);
        return res.status(200).json({ message: "Password updated successfully!" });

    }catch (error){
        console.error("❌ [Change Password] Error:", error);
        return res.status(500).json({ message: "Failed to update password. Please try again." });
    }
}