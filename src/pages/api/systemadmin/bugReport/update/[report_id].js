import {db} from "../../../../../lib/db";


export default async function handler(req, res) {
    const { report_id } = req.query;

    if (req.method !== "PUT") return res.status(405).json({ message: "Method Not Allowed" });

    const { status, adminMessage, updatedByAdmin } = req.body;

    if (!updatedByAdmin) {
        return res.status(400).json({ message: "Admin ID is required" });
    }

    try {
        const [result] = await db.query(
            "UPDATE BugReport SET status = ?, admin_message = ?, updated_by = ?, updated_at = NOW() WHERE report_id = ?",
            [status, adminMessage, updatedByAdmin, report_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bug report not found" });
        }

        res.status(200).json({ message: "Bug report updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
}
