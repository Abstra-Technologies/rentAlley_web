import { db } from "../../../lib/db";

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
            "SELECT plan_name, status, start_date, end_date, payment_status, is_trial FROM Subscription WHERE landlord_id = ? and is_active = 1",
            [landlord_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        let subscription = rows[0];

        const currentDate = new Date();
        console.log(currentDate);
        const trialEndDate = subscription.end_date ? new Date(subscription.end_date) : null;
        const subscriptionEndDate = subscription.end_date ? new Date(subscription.end_date) : null;

        // Remove trial_end_date if the trial has expired or user has paid
        if (subscription.payment_status === "Paid" || (trialEndDate && trialEndDate <= currentDate)) {
            delete subscription.trial_end_date;
        }

        // if subscription is expired
        subscription.isSubscriptionExpired = subscriptionEndDate && subscriptionEndDate <= currentDate;

        return res.status(200).json(subscription);
    } catch (error) {
        console.error("Database query error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
