import mysql from "mysql2/promise";
import  {db} from "../../lib/db";

export default async function getPropertyTypes(req, res) {
    try {
        const [rows] = await db.execute(`
            SELECT property_type AS type, COUNT(*) AS count
            FROM Property
            GROUP BY property_type
            ORDER BY count DESC;
        `);
        res.status(200).json({ propertyTypes: rows });
    } catch (error) {
        console.error("Database query failed:", error.message);
    }
}
