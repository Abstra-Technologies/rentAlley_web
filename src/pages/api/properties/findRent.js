import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET; // Store in .env

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { minPrice, maxPrice, searchQuery } = req.query; // Get price range from query params

  try {
    let query = `
      SELECT 
        p.property_id,
        p.property_name,
        p.property_type,
        p.amenities,
        p.city,
        p.street,
        p.province,
        pv.status AS verification_status,
        (SELECT pp.photo_url FROM PropertyPhoto pp WHERE pp.property_id = p.property_id LIMIT 1) AS encrypted_property_photo,
        -- Determine rent payment (either property rent or average unit rent)
        COALESCE(
          (SELECT AVG(u.rent_payment) FROM Unit u WHERE u.property_id = p.property_id),
          p.rent_payment
        ) AS rent_payment
      FROM Property p
      JOIN PropertyVerification pv ON p.property_id = pv.property_id
      WHERE pv.status = 'Verified'
    `;

    const queryParams = [];

    // ✅ Apply price range filter correctly
    if (minPrice || maxPrice) {
      query += ` AND (
        (SELECT AVG(u.rent_payment) FROM Unit u WHERE u.property_id = p.property_id) >= ? 
        OR p.rent_payment >= ?
      )`;

      queryParams.push(minPrice || 0, minPrice || 0); // Default to 0 if undefined

      if (maxPrice) {
        query += ` AND (
          (SELECT AVG(u.rent_payment) FROM Unit u WHERE u.property_id = p.property_id) <= ? 
          OR p.rent_payment <= ?
        )`;

        queryParams.push(maxPrice, maxPrice);
      }
    }
    // ✅ Search by Multiple Fields
    if (searchQuery) {
      query += ` AND (p.property_name LIKE ? OR p.city LIKE ? OR p.street LIKE ? OR p.province LIKE ?)`;
      const likeQuery = `%${searchQuery}%`;
      queryParams.push(likeQuery, likeQuery, likeQuery, likeQuery);
    }

    const [properties] = await db.execute(query, queryParams);

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
