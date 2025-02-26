import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { rentId } = req.query;

    if (!rentId) {
      return res.status(400).json({ message: "Unit ID is required" });
    }

    // Fetch unit details from db
    const units = await db.query(`SELECT * FROM Unit WHERE unit_id = ?`, [
      rentId,
    ]);

    if (!units.length) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const unit = units[0];

    // Fetch unit photos
    const [photos] = await db.query(
      `
            SELECT photo_url FROM UnitPhoto WHERE unit_id = ?
        `,
      [rentId]
    );

    // Decrypt unit photos
    const decryptedPhotos = photos
      .map((photo) => {
        try {
          return decryptData(
            JSON.parse(photo.photo_url),
            process.env.ENCRYPTION_SECRET
          );
        } catch (error) {
          console.error("Error decrypting photo:", error);
          return null;
        }
      })
      .filter(Boolean);

    return res.status(200).json({ unit, photos: decryptedPhotos });
  } catch (error) {
    console.error("Error fetching unit details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
