import { db } from "../../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { unit_id } = req.query;

    if (!unit_id) {
        return res.status(400).json({ error: "Unit ID is required" });
    }

    try {
        const [unitRecord] = await db.query(
            `SELECT property_id FROM Unit WHERE unit_id = ?`,
            [unit_id]
        );

        if (!unitRecord || unitRecord.length === 0) {
            return res.status(404).json({ error: "Unit not found" });
        }

        const { property_id } = unitRecord[0];

        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const currentMonthEnd = new Date();
        currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);
        currentMonthEnd.setHours(23, 59, 59, 999);

        const [rates] = await db.query(
            `SELECT utility_type, rate_consumed 
             FROM ConcessionaireBilling 
             WHERE property_id = ? 
             AND billing_period BETWEEN ? AND ?
             ORDER BY billing_period DESC`,
            [property_id, currentMonthStart, currentMonthEnd]
        );

        if (!rates || rates.length === 0) {
            return res.status(404).json({ error: "No concessionaire rates found for this property in the current month" });
        }

        let water_rate = null;
        let electricity_rate = null;

        rates.forEach(rate => {
            if (rate.utility_type === "water") {
                water_rate = rate.rate_consumed;
            } else if (rate.utility_type === "electricity") {
                electricity_rate = rate.rate_consumed;
            }
        });

        return res.status(200).json({
            unit_id,
            property_id,
            water_rate: water_rate || 0,
            electricity_rate: electricity_rate || 0
        });
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
