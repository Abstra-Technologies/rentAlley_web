import  {db} from "../../../lib/db";

export default async function getLandlordNumberofProperties(req, res) {
    try {
        const { landlord_id } = req.query;
        const [rows] = await db.execute(
            `SELECT COUNT(property_id) AS totalProperties FROM Property WHERE landlord_id = ?`,
            [landlord_id]
        );
        res.status(200).json({ totalProperties: rows[0].totalProperties });
    } catch (error) {
        console.error("Database error:", error);
    }
}
