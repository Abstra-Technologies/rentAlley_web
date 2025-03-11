
import { db } from "../../../../lib/db";

export default async function listOfDeactivatedAccounts(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const [rows] = await db.query(
            `SELECT user_id, firstName, lastName, email, phoneNumber, userType, createdAt 
            FROM User 
            WHERE is_active = 0`
        );

        return res.status(200).json(rows);
    } catch (error) {
        return res.status(500).json({ message: `Database Server Error ${error}` });
    }
}