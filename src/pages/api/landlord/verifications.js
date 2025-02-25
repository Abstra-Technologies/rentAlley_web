import {db} from "../../../lib/db";

export default async function getVerificationLists(req, res) {
    if (req.method === "GET") {
        try {
            const [rows] = await db.execute(`
                SELECT
                    landlord_id,
                    status,
                    reviewed_by,
                    review_date,
                    message
                FROM LandlordVerification
            `);
            res.status(200).json(rows);
        } catch (error) {
            console.error("Database Error:", error);
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
