import { db } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Get the property ID from the request query
    const { id } = req.query;

    // Fetch the property from the database
    const [rows] = await connection.execute(
      "SELECT property_id, property_name FROM Property WHERE property_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json(rows[0]); // Return the property details
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
