import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { userID, action, timestamp } = req.body;

    if (!userID || !action || !timestamp) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await db.query(
            `INSERT INTO ActivityLog (userID, action, timestamp)
       VALUES (?, ?, ?)`,
            [userID, action, timestamp]
        );
        res.status(201).json({ message: "Activity logged successfully." });
    } catch (error) {
        console.error("Error logging activity:", error);
        res.status(500).json({ error: "Failed to log activity." });
    }
}
