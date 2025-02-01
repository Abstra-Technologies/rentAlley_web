import { db } from "../../../lib/db";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        // Parse cookies to get the token
        const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
        if (!cookies || !cookies.token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Decode JWT to get the logged-in user
        const secretKey = process.env.JWT_SECRET;
        const decoded = jwt.verify(cookies.token, secretKey);
        if (!decoded || !decoded.adminID) {
            return res.status(401).json({ success: false, message: "Invalid Token" });
        }

        const currentAdminID = decoded.adminID;
        const { id } = req.query; // Get co-admin ID from URL

        if (!id) {
            return res.status(400).json({ success: false, message: "Co-admin ID is required" });
        }

        // Prevent the user from deleting themselves
        if (parseInt(id) === currentAdminID) {
            return res.status(403).json({ success: false, message: "You cannot delete yourself" });
        }

        // Delete co-admin
        const [result] = await db.query("DELETE FROM Admin WHERE adminID = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Co-admin not found" });
        }

        return res.status(200).json({ success: true, message: "Co-admin deleted successfully" });

    } catch (error) {
        console.error("Error deleting co-admin:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
