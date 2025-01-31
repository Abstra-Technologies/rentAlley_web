import mysql from "mysql2/promise";

const dbConfig = {
    host: 'rentahan-db.ctmeauk6wkzd.ap-southeast-1.rds.amazonaws.com',
    user: 'rentahan_dev', // Default value for debugging
    password: 'Rentahan_db_admin2024',
    database: 'rentahan',
};

export default async function handler(req, res) {
    if (req.method === "POST") {
        // Save message
        const { userID, message } = req.body;

        if (!userID || !message) {
            return res.status(400).json({ error: "Missing userID or message" });
        }

        try {
            const connection = await mysql.createConnection(dbConfig);
            const query = "INSERT INTO Message (userID, message) VALUES (?, ?)";
            await connection.execute(query, [userID, message]);
            await connection.end();

            return res.status(201).json({ success: true, message: "Message saved" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    } else if (req.method === "GET") {
        // Retrieve chat history
        try {
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute("SELECT * FROM Message ORDER BY timestamp ASC");
            await connection.end();

            return res.status(200).json(rows);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader("Allow", ["POST", "GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
