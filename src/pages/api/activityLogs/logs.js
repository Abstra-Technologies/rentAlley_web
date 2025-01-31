import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const [logs] = await db.query("SELECT logID, userID, adminID, action, timestamp FROM ActivityLog");
        res.status(200).json({ logs });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({ error: "Failed to fetch activity logs." });
    }
}
