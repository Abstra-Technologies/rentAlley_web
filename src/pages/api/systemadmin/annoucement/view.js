import { db } from "../../../lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";


export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        // Parse cookies to get the JWT token
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

        const admin_id = decoded.admin_id; // Get logged-in admin's ID
        console.log(`Fetching announcements made by admin_id: ${admin_id}...`);

        // Fetch only announcements created by the logged-in admin
        const [announcements] = await db.query(
            `SELECT 
                a.id, 
                a.title, 
                a.message, 
                a.target_audience, 
                a.created_at, 
                ad.username AS admin_name 
             FROM AdminAnnouncement a 
             JOIN Admin ad ON a.admin_id = ad.admin_id 
             WHERE a.admin_id = ? 
             ORDER BY a.created_at DESC`,
            [admin_id] // ✅ Securely filter announcements based on logged-in admin
        );

        return res.status(200).json({ success: true, announcements });

    } catch (error) {
        console.error("Error fetching announcements:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
