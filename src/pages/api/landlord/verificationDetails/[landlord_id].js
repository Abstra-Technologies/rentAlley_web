import {db} from "../../../../lib/db";

export default async function handler(req, res) {
    const { landlord_id } = req.query;

    if (req.method === "GET") {
        try {
            const [landlordData] = await db.query(
                `SELECT * FROM Landlord WHERE landlord_id = ?`,
                [landlord_id]
            );

            const [verificationData] = await db.query(
                `SELECT * FROM LandlordVerification WHERE landlord_id = ?`,
                [landlord_id]
            );

            if (landlordData.length === 0) {
                return res.status(404).json({ message: "Landlord not found" });
            }

            res.status(200).json({
                landlord: landlordData[0],
                verification: verificationData.length > 0 ? verificationData[0] : null,
            });
        } catch (error) {
            console.error("Database Error:", error);
            res.status(500).json({ message: "Database connection error" });
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
