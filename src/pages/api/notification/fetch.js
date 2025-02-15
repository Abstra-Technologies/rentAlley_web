import { db } from "../../lib/db";

export default async function fetchNotificationStore(req, res) {
    const { user_id, admin_id } = req.query;
    try {
        const [notifications] = await db.query(
            `SELECT * FROM Notification WHERE (user_id = ? OR admin_id = ?) ORDER BY created_at DESC`,
            [user_id || null, admin_id || null]
        );

        return res.status(200).json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Database error" });
    }
}