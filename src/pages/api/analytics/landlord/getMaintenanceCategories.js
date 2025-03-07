import  {db} from "../../../../lib/db";


export default async function GetMaintenanceCategories(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ error: "Missing landlord_id parameter" });
    }

    try {
        // Query to fetch maintenance request categories and their count
        const result = await db.query(
            `
                SELECT mr.category, COUNT(*) AS count
                FROM MaintenanceRequest mr
                         JOIN Unit u ON mr.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE p.landlord_id = ?
                GROUP BY mr.category
            `,
            [landlord_id]
        );


        res.status(200).json({ categories: result });
    } catch (error) {
        console.error("Error fetching maintenance categories:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
