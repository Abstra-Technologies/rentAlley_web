import  {db} from "../../../../lib/db";

export default async function getPropertyVisitsPerMonth(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed, ONLY fetching of records is allowed." });
    }

    try {
        const { landlord_id } = req.query;

        // Fetch visit count per month for units owned by the landlord
        const [rows] = await db.execute(
            `SELECT
                 MONTH(visit_date) AS month,
                 COUNT(*) AS visitCount
             FROM PropertyVisit
                      JOIN Unit ON PropertyVisit.unit_id = Unit.unit_id
                      JOIN Property ON Unit.property_id = Property.property_id
             WHERE Property.landlord_id = ?
             GROUP BY MONTH(visit_date)
             ORDER BY MONTH(visit_date)`,
            [landlord_id]
        );

        res.status(200).json({ visitsPerMonth: rows });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
