import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { landlord_id } = req.query;

  if (!landlord_id) {
    return res.status(400).json({ message: "Landlord ID is required" });
  }

  try {
    const query = `
      SELECT property_id, property_name
      FROM Property
      WHERE landlord_id = ?
      ORDER BY property_name;
    `;

    
    
    console.log('Executing query with landlord_id:', landlord_id);
    const [properties] = await db.execute(query, [landlord_id]);
    console.log('Retrieved properties:', properties);

    const decryptedProperties = properties.map(property => ({
      ...property,
      property_name: property.property_name.startsWith('{') ? 
        decryptData(JSON.parse(property.property_name), SECRET_KEY) : 
        property.property_name
    }));

    return res.status(200).json(decryptedProperties);
    
  } catch (error) {
    console.error("Error fetching properties:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
