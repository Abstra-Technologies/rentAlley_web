import { db } from "../../../../lib/db";

export default async function getOverallOccupancyRate(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed, ONLY fetching of records is allowed." });
    }

    try {
        const { landlord_id } = req.query;

        const [rows] = await db.execute(
            `SELECT 
                COUNT(CASE WHEN U.status = 'occupied' THEN 1 END) AS occupied_units,
                COUNT(U.unit_id) AS total_units,
                (COUNT(CASE WHEN U.status = 'occupied' THEN 1 END) / COUNT(U.unit_id)) * 100 AS occupancy_rate
             FROM Unit U
             JOIN Property P ON U.property_id = P.property_id
             WHERE P.landlord_id = ?`,
            [landlord_id]
        );

        res.status(200).json({ occupancyRate: rows[0] });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
