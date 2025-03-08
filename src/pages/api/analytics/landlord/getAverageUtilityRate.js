import  {db} from "../../../../lib/db";

export default async function getAverageUtilityRateperProperty(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ message: "Missing landlord_id parameter" });
    }

    try {
        const [rows] = await db.execute(
            `SELECT cb.property_id, 
                    cb.utility_type, 
                    AVG(cb.rate_consumed) AS avg_rate_consumed
             FROM ConcessionaireBilling cb
             JOIN Property pr ON cb.property_id = pr.property_id
             WHERE pr.landlord_id = ?
             GROUP BY cb.property_id, cb.utility_type
             ORDER BY cb.property_id;`,
            [landlord_id]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching average utility rate:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}