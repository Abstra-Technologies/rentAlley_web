import bcrypt from "bcrypt";
import { db } from "../../lib/db";
import {roles} from "../../../constant/adminroles";


export default async function handler(req, res) {
    if (req.method === "POST") {
        const { username, password, role } = req.body;

        if (!roles.some((r) => r.value === role)) {
            return res.status(400).json({ error: "Invalid role selected." });
        }

        if (!username || !password || !role) {
            return res.status(400).json({ error: "All fields are required." });
        }

        try {
            // Check if username already exists
            const [existingUser] = await db.execute(
                "SELECT username FROM Admin WHERE username = ?",
                [username]
            );

            if (existingUser.length > 0) {
                return res.status(409).json({ error: "Username already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await db.execute(
                "INSERT INTO Admin (Admin.adminID, username, password, role) VALUES (uuid(),?, ?, ?)",
                [username, hashedPassword, role]
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