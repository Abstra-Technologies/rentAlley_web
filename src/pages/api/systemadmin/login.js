import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        console.log("[DEBUG] Invalid HTTP Method:", req.method);
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        console.log("[DEBUG] Missing credentials. Received data:", req.body);
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        if (!process.env.JWT_SECRET) {
            console.error("[DEBUG] Missing JWT_SECRET in environment variables.");
            new Error("Missing JWT_SECRET in environment variables.");
        }

        console.log("[DEBUG] Fetching admin details from the database...");
        // Fetch admin from database
        const [admins] = await db.execute(
            "SELECT * FROM Admin WHERE username = ?",
            [username]
        );

        if (admins.length === 0) {
            console.log("[DEBUG] No admin found with username:", username);
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const adminRecord = admins[0];
        console.log("[DEBUG] Admin record found:", adminRecord);

        // Compare password
        console.log("[DEBUG] Comparing provided password with stored hash...");

        const isMatch = await bcrypt.compare(password, adminRecord.password);
        console.log("[DEBUG] Password comparison result:", isMatch);

        if (!isMatch) {
            console.log("[DEBUG] Password mismatch for username:", username);
            return res.status(401).json({ error: "Invalid credentials." });
        }

        console.log("[DEBUG] Password match. Generating JWT token...");
        // Generate JWT token
        const token = jwt.sign(
            {
                adminID: adminRecord.adminID,
                username: adminRecord.username,
                role: adminRecord.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("[DEBUG] JWT token generated:", token);

        // Set cookie with secure options
        const cookieOptions = [
            `token=${token}`,
            "HttpOnly",
            "Path=/",
            "Max-Age=3600",
            process.env.NODE_ENV === "development" ? "Secure" : "",
            "SameSite=Strict",
        ].filter(Boolean).join("; ");

        console.log("[DEBUG] Setting cookie with options:", cookieOptions);
        res.setHeader("Set-Cookie", cookieOptions);

        // Respond with success
        console.log("[DEBUG] Login successful for username:", username);
        res.status(200).json({
            message: "Login successful.",
            admin: {
                adminID: adminRecord.adminID,
                username: adminRecord.username,
                role: adminRecord.role,
            },
        });
    } catch (error) {
        console.error("[DEBUG] Error during login:", { error: error.message, stack: error.stack });
        res.status(500).json({ error: "Internal server error." });
    }
}