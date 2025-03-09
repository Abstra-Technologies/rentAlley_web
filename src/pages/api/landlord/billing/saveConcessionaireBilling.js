import { db } from "../../../../lib/db";

export default async function savePropertyConciessionareBilling(req, res) {

    if (req.method === "POST") {
        try {
            const { property_id, billingPeriod, electricityTotal, electricityRate, waterTotal, waterRate } = req.body;

            if (!property_id || !billingPeriod || (!electricityTotal && !waterTotal)) {
                return res.status(400).json({ error: "All fields are required" });
            }

            //  Inserrt Electricity Billing Record
            if (electricityTotal && electricityRate) {
                await db.execute(
                    "INSERT INTO ConcessionaireBilling (property_id, billing_period, utility_type, total_billed_amount, rate_consumed, created_at) VALUES (?, ?, 'electricity', ?, ?, NOW())",
                    [property_id, billingPeriod, electricityTotal, electricityRate]
                );
            }

            //  Insert Water Billing Record
            if (waterTotal && waterRate) {
                await db.execute(
                    "INSERT INTO ConcessionaireBilling (property_id, billing_period, utility_type, total_billed_amount, rate_consumed, created_at) VALUES (?, ?, 'water', ?, ?, NOW())",
                    [property_id, billingPeriod, waterTotal, waterRate]
                );
            }

            return res.status(201).json({ message: "Billing records saved successfully" });
        } catch (error) {
            return res.status(500).json({ error: `Database Server Error: ${error}` });
        }
    }

    // to get latest billing view
    if (req.method === "GET") {
        try {
            const { property_id } = req.query;

            if (!property_id) {
                return res.status(400).json({ error: "Property ID is required" });
            }

            const [billings] = await db.execute(
                `SELECT utility_type, total_billed_amount, rate_consumed, billing_period, created_at
                 FROM ConcessionaireBilling
                 WHERE property_id = ?
                   AND created_at = (SELECT MAX(created_at) FROM ConcessionaireBilling WHERE property_id = ? AND utility_type = ConcessionaireBilling.utility_type)`,
                [property_id, property_id]
            );
            return res.status(200).json(Array.isArray(billings) ? billings : []);
        } catch (error) {
            return res.status(500).json({ error: `Database Server Error: ${error}` });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
