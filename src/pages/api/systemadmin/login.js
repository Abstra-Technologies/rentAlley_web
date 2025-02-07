import bcrypt from "bcrypt";
import { db } from "../../lib/db";
import {SignJWT} from "jose";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        console.log("[DEBUG] Invalid HTTP Method:", req.method);
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        console.log("[DEBUG] Missing credentials. Received data:", req.body);
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        // Ensure JWT_SECRET is defined

        console.log("[DEBUG] Fetching admin details from the database...");
        // Fetch admin from database
        const [admins] = await db.execute(
            "SELECT * FROM Admin WHERE email = ?",
            [email]
        );

        if (admins.length === 0) {
            console.log("[DEBUG] No admin found with username:", email);
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const adminRecord = admins[0];

        if (adminRecord.status === "disabled") {
            console.log("[DEBUG] Login attempt for disabled account:", email);
            return res.status(403).json({ error: "Your account has been disabled. Please contact support." });
        }

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


        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        // Generate JWT token
        const token = await new SignJWT(
            {
                admin_id: adminRecord.admin_id,
                username: adminRecord.username,
                role: adminRecord.role,
                email: adminRecord.email,
            },
        )
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            .setSubject(adminRecord.admin_id.toString())
            .sign(secret);

        const isDev = process.env.NODE_ENV === "development";
        res.setHeader(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; ${
                isDev ? "" : "Secure;"
            } SameSite=Strict`
        );

        // Log admin activity in ActivityLog
        console.log("[DEBUG] Logging admin activity...");
        const action = "Admin logged in";
        const timestamp = new Date().toISOString();
        const admin_id = admins[0].admin_id;

        try {
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, ?)",
                [admin_id, action, timestamp]
            );
            console.log("[DEBUG] Activity logged successfully.");
        } catch (activityLogError) {
            console.error(
                "[DEBUG] Error inserting activity log:",
                activityLogError.message
            );
        }

        // Respond with success
        res.status(200).json({
            message: "Login successful.",
            admin: {
                admin_id: adminRecord.admin_id,
                username: adminRecord.username,
                role: adminRecord.role,
                email: adminRecord.email,
            },
        });
    } catch (error) {
        console.error("[DEBUG] Error during login:", { error: error.message, stack: error.stack });
        res.status(500).json({ error: "Internal server error." });
    }
}
