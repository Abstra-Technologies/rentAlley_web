import { db } from "@/lib/db";
import { decryptData } from '@/crypto/encrypt';

// @ts-ignore
export async function GET(req, { params }) {
  const property_id = params.property_id;

  if (!property_id) {
    return new Response(JSON.stringify({ message: "Missing property ID" }), { status: 400 });
  }

  try {
    const [propertyRows] = await db.execute(
        `SELECT p.*,
                pv.doc_type, pv.submitted_doc, pv.gov_id, pv.outdoor_photo, pv.indoor_photo,
                pv.status AS verification_status, pv.verified
         FROM Property p
                LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
         WHERE p.property_id = ?`,
        [property_id]
    );

    if (propertyRows.length === 0) {
      console.error("Property not found:", property_id);
      return new Response(JSON.stringify({ message: "Property not found" }), { status: 404 });
    }

    const secretKey = process.env.ENCRYPTION_SECRET;

    if (!secretKey) {
      console.error("Missing encryption secret key. Check ENCRYPTION_SECRET in .env.");
      return new Response(JSON.stringify({ message: "Encryption key missing" }), { status: 500 });
    }

    const decryptIfValid = (data) => {
      if (!data || typeof data !== "string") return null;
      try {
        const parsedData = data.trim().startsWith("{") ? JSON.parse(data) : null;
        return parsedData ? decryptData(parsedData, secretKey) : null;
      } catch (error) {
        console.error("JSON Parsing Error:", error.message, "Data:", data);
        return null;
      }
    };

    // Note: The original code references a 'photos' column, but the schema doesn't include it.
    // Assuming it might be derived from outdoor_photo and indoor_photo
    const photosArray = [];
    // @ts-ignore
    if (propertyRows[0].outdoor_photo) photosArray.push(propertyRows[0].outdoor_photo);
    // @ts-ignore
    if (propertyRows[0].indoor_photo) photosArray.push(propertyRows[0].indoor_photo);
    const uniquePhotos = [...new Set(photosArray)];

    const property = {
      // @ts-ignore
      ...propertyRows[0],
      submitted_doc: decryptIfValid(propertyRows[0].submitted_doc),
      gov_id: decryptIfValid(propertyRows[0].gov_id),
      outdoor_photo: decryptIfValid(propertyRows[0].outdoor_photo),
      indoor_photo: decryptIfValid(propertyRows[0].indoor_photo),
      photos: uniquePhotos
    };

    return Response.json(property);

  } catch (error) {
    console.error("Error fetching property:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}