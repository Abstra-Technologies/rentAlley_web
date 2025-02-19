import { db } from "../../lib/db";
import { decryptData } from "../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET; // Store in .env

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    let query = `
      SELECT 
        p.property_id,
        p.property_name,
        p.property_type,
        p.amenities,
        p.city,
        p.province,
        (SELECT pp.photo_url FROM PropertyPhoto pp WHERE pp.property_id = p.property_id LIMIT 1) AS encrypted_property_photo
      FROM Property p
      JOIN PropertyVerification pv ON p.property_id = pv.property_id
      WHERE pv.status = 'Verified';
    `;

    const [properties] = await db.execute(query);

    // 🔓 Decrypt property photos before sending response
    const decryptedProperties = properties.map((property) => ({
      ...property,
      property_photo: property.encrypted_property_photo
        ? decryptData(JSON.parse(property.encrypted_property_photo), SECRET_KEY)
        : null,
    }));

    return res.status(200).json(decryptedProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
