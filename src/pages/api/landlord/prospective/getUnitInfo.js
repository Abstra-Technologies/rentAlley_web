import { decryptData } from "../../../../crypto/encrypt";
import { db } from "../../../../lib/db";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { unit_id } = req.query;

    if (!unit_id) {
      return res.status(400).json({ error: "Unit ID is required" });
    }

    // Fetch unit details
    const [unitRows] = await db.query("SELECT * FROM Unit WHERE unit_id = ?", [
      unit_id,
    ]);
    if (unitRows.length === 0) {
      return res.status(404).json({ error: "Unit not found" });
    }
    const unit = unitRows[0];

    // Fetch associated property details
    const [propertyRows] = await db.query(
      "SELECT * FROM Property WHERE property_id = ?",
      [unit.property_id]
    );
    const property = propertyRows.length > 0 ? propertyRows[0] : null;

    // Fetch unit photos
    const [photoRows] = await db.query(
      "SELECT * FROM UnitPhoto WHERE unit_id = ?",
      [unit_id]
    );

    // Decrypt photo URLs
    const decryptedPhotos = photoRows
      .map((photo) => {
        try {
          return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
        } catch (error) {
          console.error("Error decrypting photo:", error);
          return null;
        }
      })
      .filter((photo) => photo !== null); // Filter out failed decryptions

    // Construct response
    const response = {
      unit,
      property,
      photos: decryptedPhotos,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching unit details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
