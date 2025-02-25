import { db } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  async function fetchPropertyTypesFromDatabase() {
    try {
      // Query to fetch ENUM values from the database
      const [rows] = await db.query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Property' 
        AND COLUMN_NAME = 'property_type'
      `);

      if (!rows.length) {
        console.log("Enum values not found in database.");
        return null; // Or an empty array, depending on your logic
      }

      // Extract and format ENUM values
      const enumString = rows[0].COLUMN_TYPE; // "enum('apartment','duplex','dormitory','townhouse','house')"
      const propertyTypes = enumString
        .replace(/enum\(|\)/g, "") // Remove "enum(" and ")"
        .split(",") // Split by comma
        .map((value) => value.replace(/'/g, "")); // Remove single quotes

      console.log("Successfully fetched property types from database.");
      return propertyTypes;
    } catch (error) {
      console.error("Error fetching property types from database:", error);
      throw error; // Re-throw the error to be handled in the main handler
    }
  }

  try {
    console.log("Fetching property types from database."); // More descriptive log

    const propertyTypes = await fetchPropertyTypesFromDatabase();

    if (!propertyTypes) {
      return res.status(404).json({ message: "Enum values not found" });
    }

    console.log("Successfully served property types from database.");

    res.status(200).json({ propertyTypes });
  } catch (error) {
    console.error("Error fetching property types:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
