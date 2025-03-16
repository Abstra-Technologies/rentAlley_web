
import { db } from "../../../../lib/db";
import {decryptData} from "../../../../crypto/encrypt";

export default async function listOfSuspended(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const [rows] = await db.query(
            `SELECT user_id, firstName, lastName, email, phoneNumber, userType, createdAt, updatedAt
            FROM User 
            WHERE status = 'suspended'`
        );

        const row = rows.map(rows => ({
            ...rows,
            email: decryptData(JSON.parse(rows.email), process.env.ENCRYPTION_SECRET),
            firstName: decryptData(JSON.parse(rows.firstName), process.env.ENCRYPTION_SECRET),
            lastName: decryptData(JSON.parse(rows.lastName), process.env.ENCRYPTION_SECRET),
        }));

        return res.status(200).json(row);
    } catch (error) {
        return res.status(500).json({ message: `Database Server Error ${error}` });
    }
}