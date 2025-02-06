import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { admin_id, action, timestamp } = req.body;

    if (!admin_id || !action || !timestamp) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await db.query(
            `INSERT INTO ActivityLog (admin_id, action, timestamp)
       VALUES (?, ?, ?)`,
            [admin_id, action, timestamp]
        );
        res.status(201).json({ message: "Activity logged successfully." });
    } catch (error) {
        console.error("Error logging activity:", error);
        res.status(500).json({ error: "Failed to log activity." });
    }
}
