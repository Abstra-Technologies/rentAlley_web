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
        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            console.error("[DEBUG] Missing JWT_SECRET in environment variables.");
            throw new Error("Missing JWT_SECRET in environment variables.");
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
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("[DEBUG] JWT token generated.");

        // Set cookie with secure options
        const cookieOptions = [
            `token=${token}`,
            "HttpOnly",
            "Path=/",
            "Max-Age=3600",
            process.env.NODE_ENV !== "development" ? "Secure" : "",
            "SameSite=Strict",
        ].filter(Boolean).join("; ");

        console.log("[DEBUG] Setting cookie with options:", cookieOptions);
        res.setHeader("Set-Cookie", cookieOptions);

        // Log admin activity in ActivityLog
        console.log("[DEBUG] Logging admin activity...");
        const action = "Admin logged in";
        const timestamp = new Date().toISOString();
        const adminID = admins[0].adminID;

        try {
            await db.query(
                "INSERT INTO ActivityLog (adminID, action, timestamp) VALUES (?, ?, ?)",
                [adminID, action, timestamp]
            );
            console.log("[DEBUG] Activity logged successfully.");
        } catch (activityLogError) {
            console.error(
                "[DEBUG] Error inserting activity log:",
                activityLogError.message
            );
            // Continue to return success even if activity logging fails
        }

        // Respond with success
        res.status(200).json({
            message: "Login successful.",
            admin: {
                adminID: adminRecord.adminID,
                username: adminRecord.username,
            },
        });
    } catch (error) {
        console.error("[DEBUG] Error during login:", { error: error.message, stack: error.stack });
        res.status(500).json({ error: "Internal server error." });
    }
}
