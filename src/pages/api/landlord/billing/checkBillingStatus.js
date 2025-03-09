import { db } from "../../../../lib/db";

export default async function CheckBillingStatusfortheMonth(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { property_id } = req.query;

    if (!property_id) {
        return res.status(400).json({ error: "Property ID is required" });
    }

    try {
        // Ensure only records from the current month are retrieved
        const [billingData] = await db.query(
            `SELECT * FROM ConcessionaireBilling 
       WHERE property_id = ? 
       AND DATE_FORMAT(billing_period, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
            [property_id]
        );

        res.json({ billingData });
    } catch (error) {
        console.error("Error fetching billing data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}