import { db } from "../../../../lib/db";

export default async function CheckUnitBillingStatus(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { unit_id } = req.query;

    if (!unit_id) {
        return res.status(400).json({ error: "Unit ID is required" });
    }

    try {
        const [billingData] = await db.query(
            `SELECT COUNT(*) AS bill_count
             FROM Billing
             WHERE unit_id = ?
               AND DATE_FORMAT(billing_period, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
            [unit_id]
        );

        const hasBillForThisMonth = billingData[0]?.bill_count > 0;

        res.json({ unit_id, hasBillForThisMonth });
    } catch (error) {
        res.status(500).json({ error: "Database server error" });
    }
}