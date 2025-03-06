import { db } from "../../../lib/db";

export default async function getSubscriptionLandlord(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ error: "Invalid request, missing landlord_id" });
    }

    try {
        // Fetch subscription details
        const [rows] = await db.query(
            "SELECT plan_name, start_date, end_date, payment_status, is_trial FROM Subscription WHERE landlord_id = ? AND is_active = 1",
            [landlord_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        let subscription = rows[0];

        const currentDate = new Date();
        const subscriptionEndDate = subscription.end_date ? new Date(subscription.end_date) : null;

        // If the subscription has expired, mark it as inactive
        if (subscriptionEndDate && subscriptionEndDate < currentDate && subscription.is_active === 1) {
            await db.query("UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?", [landlord_id]);
            subscription.is_active = 0; // Update the response immediately
        }

        return res.status(200).json(subscription);
    } catch (error) {
        console.error("Database query error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
