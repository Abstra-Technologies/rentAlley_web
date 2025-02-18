import bcrypt from "bcrypt";
import { db } from "../../lib/db";
import {SignJWT} from "jose";
import nodeCrypto from "crypto";

// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         console.log("Invalid HTTP Method:", req.method);
//         return res.status(405).json({ error: "Method Not Allowed" });
//     }
//
//     const { login, password, fcm_token } = req.body; // ✅ "login" can be either email or username
//
//     if (!login || !password) {
//         console.log("Missing credentials. Received data:", req.body);
//         return res.status(400).json({ error: "Username and password are required." });
//     }
//
//     try {
//         let user;
//
//         const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");
//         const [admins] = await db.execute(
//             "SELECT * FROM Admin WHERE email_hash = ?",
//             [emailHash]
//         );
//
//         const [userByEmail] = await db.query("SELECT * FROM Admin WHERE email_hashed = ?", [emailHash]);
//         const [userByUsername] = await db.query("SELECT * FROM Admin WHERE username = ?", [login]);
//
//         if (admins.length === 0) {
//             console.log("[DEBUG] No admin found with username:", email);
//             return res.status(401).json({ error: "Invalid credentials." });
//         }
//
//         const adminRecord = admins[0];
//
//         if (adminRecord.status === "disabled") {
//             console.log("[DEBUG] Login attempt for disabled account:", email);
//             return res.status(403).json({ error: "Your account has been disabled. Please contact support." });
//         }
//
//         console.log("[DEBUG] Admin record found:", adminRecord);
//
//         console.log("[DEBUG] Comparing provided password with stored hash...");
//         const isMatch = await bcrypt.compare(password, adminRecord.password);
//         console.log("[DEBUG] Password comparison result:", isMatch);
//
//         if (!isMatch) {
//             console.log("[DEBUG] Password mismatch for username:", username);
//             return res.status(401).json({ error: "Invalid credentials." });
//         }
//
//         console.log("[DEBUG] Password match. Generating JWT token...");
//
//
//         const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//
//         const token = await new SignJWT(
//             {
//                 admin_id: adminRecord.admin_id,
//                 username: adminRecord.username,
//                 role: adminRecord.role,
//                 email: adminRecord.email,
//             },
//         )
//             .setProtectedHeader({ alg: "HS256" })
//             .setExpirationTime("2h")
//             .setIssuedAt()
//             .setSubject(adminRecord.admin_id.toString())
//             .sign(secret);
//
//         const isDev = process.env.NODE_ENV === "development";
//         res.setHeader(
//             "Set-Cookie",
//             `token=${token}; HttpOnly; Path=/; ${
//                 isDev ? "" : "Secure;"
//             } SameSite=Strict`
//         );
//
//         if (fcm_token) {
//             await db.query("UPDATE Admin SET fcm_token = ? WHERE admin_id = ?", [fcm_token, adminRecord.admin_id]);
//         }
//
//         console.log("Logging admin activity...");
//         const action = "Admin logged in";
//         const timestamp = new Date().toISOString();
//         const admin_id = admins[0].admin_id;
//
//         try {
//             await db.query(
//                 "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, ?)",
//                 [admin_id, action, timestamp]
//             );
//             console.log("[DEBUG] Activity logged successfully.");
//         } catch (activityLogError) {
//             console.error(
//                 "[DEBUG] Error inserting activity log:",
//                 activityLogError.message
//             );
//         }
//
//         // Respond with success
//         res.status(200).json({
//             message: "Login successful.",
//             admin: {
//                 admin_id: adminRecord.admin_id,
//                 username: adminRecord.username,
//                 role: adminRecord.role,
//                 email: adminRecord.email,
//             },
//         });
//     } catch (error) {
//         console.error("[DEBUG] Error during admin_login:", { error: error.message, stack: error.stack });
//         res.status(500).json({ error: "Internal server error." });
//     }
// }

import { parse } from "cookie";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        console.log("Invalid HTTP Method:", req.method);
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { login, password, fcm_token } = req.body;

    if (!login || !password) {
        console.log("Missing credentials. Received data:", req.body);
        return res.status(400).json({ error: "Username or email and password are required." });
    }
    try {
        let user;
        let emailHash;

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
            console.log("[DEBUG] No admin found with provided credentials:", login);
            return res.status(401).json({ error: "Invalid credentials." });
        }

        if (user.status === "disabled") {
            console.log("[DEBUG] Login attempt for disabled account:", login);
            return res.status(403).json({ error: "Your account has been disabled. Please contact support." });
        }

        console.log("[DEBUG] Admin record found:", user);

        console.log("[DEBUG] Comparing provided password with stored hash...");
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("[DEBUG] Password comparison result:", isMatch);

        if (!isMatch) {
            console.log("[DEBUG] Password mismatch for login:", login);
            return res.status(401).json({ error: "Invalid credentials." });
        }
        console.log("[DEBUG] Password match. Generating JWT token...");

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);

        const token = await new SignJWT({
            admin_id: user.admin_id,
            username: user.username,
            role: user.role,
            email: user.email,
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

        if (fcm_token) {
            await db.query("UPDATE Admin SET fcm_token = ? WHERE admin_id = ?", [fcm_token, user.admin_id]);
        }

        console.log("Logging admin activity...");
        const action = "Admin logged in";
        const timestamp = new Date().toISOString();

        try {
            await db.query(
                "INSERT INTO ActivityLog (admin_username, action, timestamp) VALUES (?, ?, ?)",
                [user.username, action, timestamp]
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
