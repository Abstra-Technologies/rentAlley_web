import bcrypt from "bcrypt";
import { db } from "../../../lib/db";
import {roles} from "../../../constant/adminroles";
import { encryptData } from "../../../crypto/encrypt";
import {parse} from "cookie";
import {jwtVerify} from "jose";
import CryptoJS from "crypto-js";


export default async function addAdmin(req, res) {
    let currentLoggedAdmin;

    if (req.method === "POST") {

        // region GET CURRENT USER ADMIN
        try {
            const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
            if (!cookies || !cookies.token) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(cookies.token, secretKey);
            currentLoggedAdmin = payload.admin_id;
        } catch (err) {
            return res.status(401).json({ success: false, message: err });
        }
        endregion

        const { email, username, password, role, first_name, last_name, permissions } = req.body;

        // Validate role
        if (!roles.some((r) => r.value === role)) {
            return res.status(400).json({ error: "Invalid role selected." });
        }

        // Validate required fields
        if (!username || !password || !role || !email || !permissions) {
            return res.status(400).json({ error: "All fields are required." });
        }

        // Validate permissions format
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({ error: "Invalid permissions format." });
        }

        try {
            const emailHash = CryptoJS.SHA256(email).toString();

            // Check if user already exists
            const [existingUser] = await db.execute(
                "SELECT email_hash, username FROM Admin WHERE email_hash = ? OR username = ?",
                [emailHash, username]
            );

            if (existingUser.length > 0) {
                if (existingUser[0].email_hash === emailHash) {
                    return res.status(409).json({ error: "Email already exists." });
                }
                if (existingUser[0].username === username) {
                    return res.status(409).json({ error: "Username already exists." });
                }
            }

            // Encrypt sensitive data
            const hashedPassword = await bcrypt.hash(password, 10);
            const emailEncrypted = JSON.stringify(encryptData(email, process.env.ENCRYPTION_SECRET));
            const fnameEncrypted = JSON.stringify(encryptData(first_name, process.env.ENCRYPTION_SECRET));
            const lnameEncrypted = JSON.stringify(encryptData(last_name, process.env.ENCRYPTION_SECRET));

            // Convert permissions array into a comma-separated string
            const permissionsString = permissions.join(",");

            // Insert new admin
            await db.execute(
                "INSERT INTO Admin (admin_id, username, first_name, last_name, email_hash, email, password, role, permissions) VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    username,
                    fnameEncrypted,
                    lnameEncrypted,
                    emailHash,
                    emailEncrypted,
                    hashedPassword,
                    role,
                    permissionsString // Store permissions as a comma-separated string
                ]
            );

            // Log activity
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                [currentLoggedAdmin, `Added new Co-admin ${username}`]
            );

            return res.status(201).json({ message: "Admin registered successfully." });

        } catch (error) {
            console.error("Error registering admin:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}