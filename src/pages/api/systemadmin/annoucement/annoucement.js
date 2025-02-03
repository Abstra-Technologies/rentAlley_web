import { db } from "../../../lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        //   retrieving user information (specifically admin_id) only if the request is authorized.
        // the process as follows:
        // Checks for a token in cookies
        // Verifies the token to ensure it's valid
        // Extracts user data (admin_id) from the token
        // ❌ Rejects the request if the token is missing, invalid, or does not contain required data

        // Parse cookies to get the token
        const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
        if (!cookies || !cookies.token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Verify JWT token using `jose`
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let decoded;
        try {
            const { payload } = await jwtVerify(cookies.token, secretKey);
            decoded = payload;
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid Token" });
        }

        if (!decoded || !decoded.admin_id) {
            return res.status(401).json({ success: false, message: "Invalid Token Data" });
        }

        const { title, message, target_audience } = req.body;

        if (!title || !message || !target_audience) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const [result] = await db.query(
            "INSERT INTO AdminAnnouncement (admin_id, title, message, target_audience) VALUES (?, ?, ?, ?)",
            [decoded.admin_id, title, message, target_audience]
        );

        return res.status(201).json({ success: true, message: "Announcement created successfully!" });

    } catch (error) {
        console.error("Error creating announcement:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
