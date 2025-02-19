import { db } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Query to fetch ENUM values
    const [rows] = await db.query(`
          SELECT COLUMN_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'MaintenanceRequest' 
          AND COLUMN_NAME = 'category'
      `);

    if (!rows.length) {
      return res.status(404).json({ message: "Enum values not found" });
    }

    // Extract and format ENUM values
    const enumString = rows[0].COLUMN_TYPE;
    const category = enumString
      .replace(/enum\(|\)/g, "") // Remove "enum(" and ")"
      .split(",") // Split by comma
      .map((value) => value.replace(/'/g, "")); // Remove single quotes

    res.status(200).json({ category });
  } catch (error) {
    console.error("Error fetching property types:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
