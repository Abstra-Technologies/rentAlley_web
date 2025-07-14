import { db } from "../../../lib/db";

export default async function getNotification(req, res) {
    if (req.method === "GET") {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            console.log("Fetching notifications for user:", userId);

            const [notifications] = await db.query(
                "SELECT id, title, body, is_read, created_at FROM Notification WHERE user_id = ? ORDER BY created_at DESC",
                [userId]
            );

            return res.status(200).json(notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return res.status(500).json({ error: "Database error" });
        }
    }

    if (req.method === "PATCH") {
        try {
            const { id } = req.body;

            if (!id) {
                return res.status(400).json({ error: "Notification ID is required" });
            }
            await db.query("UPDATE Notification SET is_read = 1 WHERE id = ?", [id]);

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error updating notification:", error);
            return res.status(500).json({ error: "Database error" });
        }
    }

    res.status(405).json({ error: "Method not allowed" });
}
