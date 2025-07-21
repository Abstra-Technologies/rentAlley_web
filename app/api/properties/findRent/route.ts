import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const searchQuery = searchParams.get("searchQuery");

  try {
    let query = `
      SELECT 
          p.property_id,
          p.property_name,
          p.city,
          p.street,
          p.flexipay_enabled,
          p.province,
          p.latitude, 
          p.longitude,
          pv.status AS verification_status,
          (SELECT pp.photo_url FROM PropertyPhoto pp WHERE pp.property_id = p.property_id LIMIT 1) AS encrypted_property_photo,
          MIN(u.rent_amount) AS rent_amount
      FROM Property p
      JOIN PropertyVerification pv ON p.property_id = pv.property_id
      LEFT JOIN Unit u ON p.property_id = u.property_id
      WHERE pv.status = 'Verified' AND p.status = 'active'
    `;

    const queryParams: (string | number)[] = [];

    if (minPrice || maxPrice) {
      query += ` AND u.rent_amount >= ?`;
      queryParams.push(Number(minPrice) || 0);

      if (maxPrice) {
        query += ` AND u.rent_amount <= ?`;
        queryParams.push(Number(maxPrice));
      }
    }

    if (searchQuery) {
      query += ` AND (p.property_name LIKE ? OR p.city LIKE ? OR p.street LIKE ? OR p.province LIKE ?)`;
      const likeQuery = `%${searchQuery}%`;
      queryParams.push(likeQuery, likeQuery, likeQuery, likeQuery);
    }

    query += ` GROUP BY p.property_id;`;

    const [properties] = await db.execute(query, queryParams);

    const decryptedProperties = properties.map((property: any) => ({
      ...property,
      property_photo: property.encrypted_property_photo
        ? decryptData(JSON.parse(property.encrypted_property_photo), SECRET_KEY!)
        : null,
    }));

    return NextResponse.json(decryptedProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json({ message: "Database Server Error" }, { status: 500 });
  }
}
