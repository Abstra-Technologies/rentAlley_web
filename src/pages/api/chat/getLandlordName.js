import { db } from "../../lib/db";


export default async function getLandlordName(req, res) {

    const { landlord_id } = req.query;

    if (!landlord_id) return res.status(400).json({ error: "Missing landlord_id" });

    try {
        const [result] = await db.query(
            `SELECT u.firstName 
             FROM User u 
             JOIN Landlord l ON u.user_id = l.user_id
             WHERE l.landlord_id = ?`,
            [landlord_id]
        );

        if (result.length === 0) return res.status(404).json({ error: "Landlord not found" });

        res.status(200).json({ landlordName: result[0].firstName });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
