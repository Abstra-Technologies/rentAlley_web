import mysql from "mysql2/promise";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        // Connect to MySQL database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Query to count properties by type
        const [rows] = await connection.execute(`
            SELECT property_type AS type, COUNT(*) AS count
            FROM Property
            GROUP BY property_type
            ORDER BY count DESC;
        `);

        await connection.end();

        res.status(200).json({ propertyTypes: rows });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
