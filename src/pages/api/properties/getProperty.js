import { db } from "../../lib/db";
import { decryptData } from "../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET; // Store in .env

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Property ID is required" });

  try {
    // ✅ Fetch property details with an encrypted property photo
    let query = `
      SELECT 
        p.property_id,
        p.property_name,
        p.landlord_id,
        p.property_type,
        p.amenities,
        p.city,
        p.province,
        (SELECT pp.photo_url FROM PropertyPhoto pp WHERE pp.property_id = p.property_id LIMIT 1) AS encrypted_property_photo
      FROM Property p
      WHERE p.property_id = ?;
    `;

    const [property] = await db.execute(query, [id]);
    if (!property.length)
      return res.status(404).json({ message: "Property not found" });

    // ✅ Fetch units associated with the property
    let unitsQuery = `
      SELECT * FROM Unit WHERE property_id = ?;
    `;
    const [units] = await db.execute(unitsQuery, [id]);

    // ✅ Fetch unit photos
    let unitPhotosQuery = `
      SELECT unit_id, photo_url FROM UnitPhoto WHERE unit_id IN (${
        units.map((u) => u.unit_id).join(",") || 0
      });
    `;
    const [unitPhotos] = await db.execute(unitPhotosQuery);

    // ✅ Decrypt property photo
    let decryptedPhoto = null;
    try {
      const encryptedPhoto = property[0].encrypted_property_photo;
      if (encryptedPhoto) {
        decryptedPhoto = decryptData(JSON.parse(encryptedPhoto), SECRET_KEY);
      }
    } catch (err) {
      console.error("Decryption failed for property photo:", err);
    }

    // 🔗 Attach and decrypt photos for respective units
    const unitsWithPhotos = units.map((unit) => {
      const unitPhotosForThisUnit = unitPhotos
        .filter((photo) => photo.unit_id === unit.unit_id)
        .map((photo) => {
          try {
            return decryptData(JSON.parse(photo.photo_url), SECRET_KEY); // ✅ Decrypt unit photo
          } catch (err) {
            console.error("Decryption failed for unit photo:", err);
            return null;
          }
        })
        .filter(Boolean); // Remove any failed decryptions

      return {
        ...unit,
        photos: unitPhotosForThisUnit,
      };
    });

    return res.status(200).json({
      ...property[0],
      property_photo: decryptedPhoto,
      units: unitsWithPhotos, // Now includes decrypted unit photos
    });
  } catch (error) {
    console.error("Error fetching property details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
