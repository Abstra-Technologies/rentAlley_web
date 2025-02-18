import { db } from "../../lib/db";

export default async function logs(req, res) {
    try {
        const [logs] = await db.query("SELECT log_id, user_id, admin_id, action, timestamp FROM ActivityLog");
        res.status(200).json({ logs });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
    }
}
