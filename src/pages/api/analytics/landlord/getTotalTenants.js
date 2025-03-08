import  {db} from "../../../../lib/db";

export default async function getNumberofActiveTeenants(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ message: "Missing landlord_id parameter" });
    }

    try {
        const [rows] = await db.execute(
            `SELECT COUNT(DISTINCT la.tenant_id) AS total_tenants
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property pr ON u.property_id = pr.property_id
            WHERE pr.landlord_id = ? 
              AND la.status = 'active';`,
            [landlord_id]
        );

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching tenant count:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}