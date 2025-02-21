import mysql from "mysql2/promise";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: "Missing user_id" });
    }

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [rows] = await db.execute(
            `SELECT is_verified FROM Landlord WHERE user_id = ?`,
            [user_id]
        );

        await db.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: "Landlord not found" });
        }

        return res.status(200).json({ is_verified: rows[0].is_verified });
    } catch (error) {
        console.error("🔥 Database Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
