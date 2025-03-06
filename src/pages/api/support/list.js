import { db } from "../../../lib/db";

export default async function getListofSupports(req, res) {
    if (req.method === "GET") {
        try {
            const [supportRequests] = await db.query(
                "SELECT * FROM SupportRequest ORDER BY created_at DESC"
            );
            return res.status(200).json(supportRequests);
        } catch (error) {
            console.error("Error fetching support requests:", error);
            return res.status(500).json({ error: "Failed to fetch support requests." });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
