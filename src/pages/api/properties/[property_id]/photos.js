import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    try {
        const { property_id } = req.query;

        if (!property_id) {
            return res.status(400).json({ message: "Missing property ID" });
        }

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            timezone: '+08:00',
        });

        const [photoRows] = await connection.execute(
            `SELECT DISTINCT photo_url FROM PropertyPhoto WHERE property_id = ? ORDER BY photo_id ASC`,
            [property_id]
        );

        if (photoRows.length === 0) {
            return res.status(404).json({ message: "No photos found for this property." });
        }

        const photos = photoRows.map(row => row.photo_url);
        res.status(200).json({ photos });

    } catch (error) {
        console.error("Error fetching property photos:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
