import { db } from "../../lib/db";

export default async function getSubscriptionLandlord(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ error: "Invalid request" });
    }

    try {
        const [rows] = await db.query(
            "SELECT plan_name, status, start_date, end_date, trial_end_date, payment_status FROM Subscription WHERE landlord_id = ?",
            [landlord_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Database query error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
