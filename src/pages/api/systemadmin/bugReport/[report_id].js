import {db} from "../../../../lib/db";

export default async function handler(req, res) {
    const { report_id } = req.query;

    if (req.method === "GET") {
        try {
            const [rows] = await db.query("SELECT * FROM BugReport WHERE report_id = ?", [report_id]);

            if (rows.length === 0) {
                return res.status(404).json({ message: "Bug report not found" });
            }

            res.status(200).json(rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
