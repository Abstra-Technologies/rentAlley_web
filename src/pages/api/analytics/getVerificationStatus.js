import mysql from "mysql2/promise";

export default async function getVerificationStatus(req, res) {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await connection.execute(`
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
