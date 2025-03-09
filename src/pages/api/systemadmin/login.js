import bcrypt from "bcrypt";
import { db } from "../../../lib/db";
import {SignJWT} from "jose";
import nodeCrypto from "crypto";

export default async function admminLogin(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { login, password } = req.body;

    if (!login || !password) {
        console.log("Missing credentials. Received data:", req.body);
        return res.status(400).json({ error: "Username or email and password are required." });
    }
    try {
        let user;

        if (login.includes("@")) {
            const emailHash = nodeCrypto.createHash("sha256").update(login).digest("hex");
            console.log("Generate Hash:" + emailHash);
            const [userByEmail] = await db.query("SELECT * FROM Admin WHERE email_hash = ?", [emailHash]);
            user = userByEmail.length > 0 ? userByEmail[0] : null;
        } else {
            const [userByUsername] = await db.query("SELECT * FROM Admin WHERE username = ?", [login]);
            user = userByUsername.length > 0 ? userByUsername[0] : null;
        }

        if (!user) {
            console.log("No admin found with provided credentials:", login);
            return res.status(401).json({ error: "Invalid credentials." });
        }

        if (user.status === "disabled") {
            console.log("Login attempt for disabled account:", login);
            return res.status(403).json({ error: "Your account has been disabled. Please contact support." });
        }

        console.log("Admin record found:", user);
        console.log("Comparing provided password with stored hash...");
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password comparison result:", isMatch);

        if (!isMatch) {
            console.log(" Password mismatch for login:", login);
            return res.status(401).json({ error: "Invalid credentials." });
        }
        console.log("Password match. Generating JWT token...");

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);

        const token = await new SignJWT({
            admin_id: user.admin_id,
            username: user.username,
            role: user.role,
            email: user.email,
            permissions: user.permissions ? user.permissions.split(",").map(p => p.trim()) : [], // Ensure array format
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            .setSubject(user.admin_id.toString())
            .sign(secret);

        const isDev = process.env.NODE_ENV === "development";
        res.setHeader(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; ${isDev ? "" : "Secure;"} SameSite=Strict`
        );



        console.log("Logging admin activity...");
        const action = "Admin logged in";
        const timestamp = new Date().toISOString();

        try {
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, ?)",
                [user.admin_id, action, timestamp]
            );
            console.log("[DEBUG] Activity logged successfully.");
        } catch (activityLogError) {
            console.error("[DEBUG] Error inserting activity log:", activityLogError.message);
        }

        res.status(200).json({
            message: "Login successful.",
            admin: {
                admin_id: user.admin_id,
                username: user.username,
                role: user.role,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("[DEBUG] Error during admin login:", { error: error.message, stack: error.stack });
        res.status(500).json({ error: "Internal server error." });
    }
}
