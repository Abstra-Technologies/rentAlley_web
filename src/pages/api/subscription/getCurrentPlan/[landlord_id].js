import { db } from "../../../lib/db";
import {infinite} from "swr/infinite";


export default async function getSubscription(req, res) {
    const { landlord_id } = req.query;

    try{
        const [rows] = await db.query(
            "SELECT plan_name, status, start_date, end_date, trial_end_date, payment_status FROM Subscription WHERE landlord_id = ?",
            [landlord_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        let subscription = rows[0];

        const listingLimits = {
            "Free Plan": { maxProperties: 1, maxUnits: 2, maxMaintenanceRequest: 5 },
            "Standard Plan": { maxProperties: 5, maxUnits: 10, maxMaintenanceRequest: 10, },
            "Premium Plan": { maxProperties: 20, maxUnits: 50, maxMaintenanceRequest: infinite },
        };

        subscription.listingLimits = listingLimits[subscription.plan_name] || listingLimits["Free Plan"];
        return res.status(200).json(subscription);

    }catch (error) {
        console.error("Database query error:", error);
    }
}