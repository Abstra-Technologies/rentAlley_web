import { db } from "../../../lib/db";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

// export default async function handler(req, res) {
//     if (req.method !== "DELETE") {
//         return res.status(405).json({ message: "Method Not Allowed" });
//     }
//
//     try {
//         // Parse cookies to get the token
//         const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
//         if (!cookies || !cookies.token) {
//             return res.status(401).json({ success: false, message: "Unauthorized" });
//         }
//
//         // Decode JWT to get the logged-in user
//         const secretKey = process.env.JWT_SECRET;
//         const decoded = jwt.verify(cookies.token, secretKey);
//         if (!decoded || !decoded.admin_id) {
//             return res.status(401).json({ success: false, message: "Invalid Token" });
//         }
//
//         const currentadmin_id = decoded.admin_id;
//         const { id } = req.query; // Get co-admin ID from URL
//
//         if (!id) {
//             return res.status(400).json({ success: false, message: "Co-admin ID is required" });
//         }
//
//         // Prevent the user from deleting themselves
//         if (parseInt(id) === currentadmin_id) {
//             return res.status(403).json({ success: false, message: "You cannot delete yourself" });
//         }
//
//         // Delete co-admin
//         const [result] = await db.query("DELETE FROM Admin WHERE admin_id = ?", [user_id]);
//
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ success: false, message: "Co-admin not found" });
//         }
//
//         return res.status(200).json({ success: true, message: "Co-admin deleted successfully" });
//
//     } catch (error) {
//         console.error("Error deleting co-admin:", error);
//         return res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
//
//     if(req.method !== "PATCH") {
//
//     }
// }

export default async function handler(req, res) {
    try {
        // Parse cookies to get the token
        const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
        if (!cookies || !cookies.token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Decode JWT to get the logged-in user
        const secretKey = process.env.JWT_SECRET;
        const decoded = jwt.verify(cookies.token, secretKey);
        if (!decoded || !decoded.admin_id) {
            return res.status(401).json({ success: false, message: "Invalid Token" });
        }

        const currentadmin_id = decoded.admin_id;
        const { admin_id } = req.query; // Get co-admin ID from URL

        if (!admin_id) {
            return res.status(400).json({ success: false, message: "Co-admin ID is required" });
        }

        // Prevent the user from deleting or disabling themselves
        if (parseInt(admin_id) === currentadmin_id) {
            return res.status(403).json({ success: false, message: "You cannot modify yourself" });
        }

        // **DELETE Request: Remove Co-Admin**
        if (req.method === "DELETE") {
            const [result] = await db.query("DELETE FROM Admin WHERE admin_id = ?", [admin_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Co-admin not found" });
            }
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                [req.admin_id, `Deleted Co-admin with ID: (ID: ${admin_id})`]
            );

            return res.status(200).json({ success: true, message: "Co-admin deleted successfully" });
        }

        // **PATCH Request: Disable Co-Admin**
        else if (req.method === "PATCH") {
            const { status } = req.body; // Expecting { status: "disabled" }

            if (!["active", "disabled"].includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status value" });
            }

            const [updateResult] = await db.query(
                "UPDATE Admin SET status = ? WHERE admin_id = ?",
                [status, admin_id]
            );

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Co-admin not found" });
            }
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                [req.admin_id, `Updated Co-admin - ID: ${admin_id}) status to ${status}`]
            );
            return res.status(200).json({ success: true, message: `Co-admin ${status} successfully` });
        }

        // **Method Not Allowed**
        else {
            res.setHeader("Allow", ["DELETE", "PATCH"]);
            return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error("Error processing co-admin request:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
