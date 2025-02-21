import { db } from "../../../lib/db";

export default async function getLandlordVerification(req, res) {

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ error: "Invalid request" });
    }

    try {
        const [rows] = await db.query(
            "SELECT is_verified FROM Landlord WHERE landlord_id = ?",
            [landlord_id]
        );
        return res.status(200).json({ is_verified: rows[0].verified === 1 });
    } catch (error) {
        console.error("Database query error:", error);
    }
}
