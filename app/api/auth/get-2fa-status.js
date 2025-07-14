import mysql from "mysql2/promise";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows] = await connection.query(
            "SELECT is_2fa_enabled FROM User WHERE user_id = ?",
            [user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ is2FAEnabled: !!rows[0].twofa_enabled });

    } catch (error) {
        console.error("Error fetching 2FA status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
