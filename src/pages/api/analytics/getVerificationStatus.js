import mysql from "mysql2/promise";
import  {db} from "../../../lib/db";

export default async function getVerificationStatus(req, res) {
    try {
        const [rows] = await db.execute(`
            SELECT status, COUNT(*) AS count
            FROM PropertyVerification
            GROUP BY status
            ORDER BY count DESC;
        `);
        res.status(200).json({ verificationStatus: rows });
    } catch (error) {
        console.error("Database query error:", error);
    }
}
