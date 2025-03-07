import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  const { property_id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let connection = await db.getConnection();
  try {
    const [units] = await connection.execute(
      `SELECT * FROM Unit WHERE property_id = ?`,
      [property_id]
    );

    res.status(200).json(units);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
