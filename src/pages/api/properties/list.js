import { db } from "../../lib/db";

export default async function propertyListing(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const [properties] = await db.query(`
            SELECT 
                p.property_id, 
                p.landlord_id,
                p.property_name, 
                p.city, 
                pv.status AS verification_status,
                pv.reviewed_by,
                pv.attempts
            FROM Property p
            LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
        `);

        res.status(200).json({ properties });

    } catch (error) {
        console.error("Error fetching properties:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
