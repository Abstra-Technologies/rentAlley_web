import { db } from "../../lib/db";

export default async function handler(req, res) {
    const { user_id, action, timestamp } = req.body;

    if (!user_id || !action || !timestamp) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        await db.query(
            `INSERT INTO ActivityLog (user_id, action, timestamp)
       VALUES (?, ?, ?)`,
            [user_id, action, timestamp]
        );
        return res.status(200).json({ message: "Signout log recorded successfully" });

    } catch (error) {
        console.error("Error logging signout activity:", error);
    }
}
