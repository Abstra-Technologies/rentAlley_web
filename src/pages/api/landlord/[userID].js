import { db } from "../../lib/db";

export default async function handler(req, res) {
    const { userID } = req.query;

    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const query = "SELECT landlord_id FROM landlords WHERE userID = ?";
        const [rows] = await db.execute(query, [userID]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Landlord not found" });
        }

        res.status(200).json(rows[0]); // { landlord_id: value }
    } catch (error) {
        console.error("Error fetching landlord ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
