import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const [properties] = await db.query(`
            SELECT 
                p.property_id, 
                p.property_name, 
                p.city, 
                p.property_status, 
                pv.status AS verification_status
            FROM Property p
            LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
        `);

        res.status(200).json({ properties });

    } catch (error) {
        console.error("Error fetching properties:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
