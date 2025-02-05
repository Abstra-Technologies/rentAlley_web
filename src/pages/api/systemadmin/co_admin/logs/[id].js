import { db } from "../../../../lib/db";

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    try {
        const [logs] = await db.query(
            "SELECT logID, action, timestamp FROM ActivityLog WHERE admin_id = ? ORDER BY timestamp DESC",
            [id]
        );

        if (logs.length === 0) {
            return res.status(404).json({ success: false, message: "No logs found for this admin." });
        }

        return res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
