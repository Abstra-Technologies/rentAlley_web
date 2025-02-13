import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


export default async function getPropertyTypes(req, res) {
    try {
        const [rows] = await connection.execute(`
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
