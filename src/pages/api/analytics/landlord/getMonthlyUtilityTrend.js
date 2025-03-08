import  {db} from "../../../../lib/db";

export default async function getMonthlyUtilityTrend(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ message: "Missing landlord_id parameter" });
    }

    try {
        const [rows] = await db.execute(
            `SELECT DATE_FORMAT(cb.billing_period, '%Y-%m') AS month, 
                    cb.utility_type,
                    SUM(cb.total_billed_amount) AS total_expense
             FROM ConcessionaireBilling cb
             JOIN Property pr ON cb.property_id = pr.property_id
             WHERE pr.landlord_id = ?
             GROUP BY month, cb.utility_type
             ORDER BY month;`,
            [landlord_id]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching monthly utility trend:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
