import { db } from "../../../../lib/db";


export default async function savePropertyConciessionareBilling(req, res) {

    if (req.method === "POST") {
        try {
            const { property_id, billingPeriod, electricityTotal, electricityRate, waterTotal, waterRate } = req.body;

            if (!property_id || !billingPeriod || (!electricityTotal && !waterTotal)) {
                return res.status(400).json({ error: "All fields are required" });
            }

            // Insert Electricity Billing Record if provided
            if (electricityTotal && electricityRate) {
                await db.execute(
                    "INSERT INTO ConcessionaireBilling (property_id, billing_period, utility_type, total_billed_amount, rate_consumed, created_at) VALUES (?, ?, 'electricity', ?, ?, NOW())",
                    [property_id, billingPeriod, electricityTotal, electricityRate]
                );
            }

            // Insert Water Billing Record if provided
            if (waterTotal && waterRate) {
                await db.execute(
                    "INSERT INTO ConcessionaireBilling (property_id, billing_period, utility_type, total_billed_amount, rate_consumed, created_at) VALUES (?, ?, 'water', ?, ?, NOW())",
                    [property_id, billingPeriod, waterTotal, waterRate]
                );
            }

            await db.end();
            return res.status(201).json({ message: "Billing records saved successfully" });
        } catch (error) {
            console.error("Error saving billing:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    if (req.method === "GET") {
        try {
            const { property_id } = req.query;

            if (!property_id) {
                return res.status(400).json({ error: "Property ID is required" });
            }

            // Fetch billing data using raw SQL
            const [billings] = await db.execute(
                "SELECT * FROM ConcessionaireBilling WHERE property_id = ? ORDER BY created_at DESC",
                [property_id]
            );

            await db.end();
            return res.status(200).json(billings);
        } catch (error) {
            console.error("Error fetching billing:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
