import {db} from "../../lib/db";

export default async function handler(req, res) {
    if (req.method === "GET") {
        try {
            const [rows] = await db.query(`
        SELECT 
          l.landlord_id, 
          l.verified, 
          lv.status 
        FROM Landlord l
        LEFT JOIN LandlordVerification lv ON l.landlord_id = lv.landlord_id
      `);

            res.status(200).json(rows);
        } catch (error) {
            console.error("Database Error:", error);
            res.status(500).json({ message: "Database connection error" });
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
