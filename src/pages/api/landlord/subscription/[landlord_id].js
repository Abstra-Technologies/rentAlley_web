import { db } from "../../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    try {
        const [subscription] = await db.query(
            `SELECT * FROM Subscription WHERE landlord_id = ? LIMIT 1`,
            [landlord_id]
        );

        if (!subscription || subscription.length === 0) {
            return res.status(404).json({ message: "No active subscription found." });
        }

        res.status(200).json(subscription[0]);
    } catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({ message: "Failed to retrieve subscription details." });
    }
}
