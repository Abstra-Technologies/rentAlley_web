import { db } from "../../../lib/db";
import {parse} from "cookie";
import {jwtVerify} from "jose";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        console.log("Fetching all admins except the logged-in user...");

        // this code is for to opt out from the list the current user.
        // Parse cookies to get the token of the current user.
        const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
        if (!cookies || !cookies.token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let decoded;
        try {
            const { payload } = await jwtVerify(cookies.token, secretKey);
            decoded = payload;
        } catch (err) {
            console.log("Error:", err);
        }

        if (!decoded || !decoded.admin_id) {
            return res.status(401).json({ success: false, message: "Invalid Token Data" });
        }

        const currentadmin_id = decoded.admin_id; // Extract logged-in admin's ID

        // Fetch all admins except the logged-in one
        const [admins] = await db.query(
            "SELECT admin_id, username, email, status FROM Admin WHERE admin_id != ?",
            [currentadmin_id]
        );

        if (!admins || admins.length === 0) {
            return res.status(200).json({ success: false, message: "No record found" });
        }

        console.log("Admins fetched:", admins);
        return res.status(200).json({ admins });

    } catch (error) {
        console.error("Error fetching admin users:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}