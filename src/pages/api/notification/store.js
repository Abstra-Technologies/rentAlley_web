import { db } from "../../lib/db";

export default async function pushNotificationStore (req, res) {
    const { user_id, admin_id, title, body } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO Notification (user_id, admin_id, title, body) VALUES (?, ?, ?, ?)`,
            [user_id || null, admin_id || null, title, body]
        );

        return res.status(201).json({ message: "Notification stored successfully", notification_id: result.insertId });
    } catch (error) {
        console.error("Error storing notification:", error);
        return res.status(500).json({ message: "Database error" });
    }
}