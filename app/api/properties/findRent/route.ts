import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const searchQuery = searchParams.get("searchQuery");
  const propertyType = searchParams.get("propertyType");
  const furnishing = searchParams.get("furnishing");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minSize = searchParams.get("minSize");
  const location = searchParams.get("location");
  const unitStyle = searchParams.get("unitStyle");

  // Unique cache key based on filters
  const cacheKey = `units:${searchQuery || "any"}:${propertyType || "any"}:${
    furnishing || "any"
  }:${minPrice || "any"}:${maxPrice || "any"}:${minSize || "any"}:${
    location || "any"
  }:${unitStyle || "any"}`;

  try {
    // Check cache first
    const cached = await redis.get(cacheKey);

    if (cached) {
      let parsed;
      try {
        parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      } catch (err) {
        console.error("Cache parse error:", err);
        parsed = cached;
      }

      return NextResponse.json({ data: parsed });
    }

    // Build SQL query for UNITS
    let query = `
      SELECT
        u.unit_id,
        u.unit_name,
        u.unit_style,
        u.unit_size,
        u.rent_amount,
        u.furnish,
        u.amenities,
        u.status,
        p.property_id,
        p.property_name,
        p.property_type,
        p.city,
        p.province,
        p.street,
        p.latitude,
        p.longitude,
        p.flexipay_enabled,
        p.landlord_id,
        pv.status AS verification_status,
        GROUP_CONCAT(up.photo_url) AS encrypted_unit_photos
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      JOIN PropertyVerification pv ON p.property_id = pv.property_id
      LEFT JOIN UnitPhoto up ON u.unit_id = up.unit_id
      WHERE pv.status = 'Verified'
        AND p.status = 'active'
        AND u.status = 'unoccupied'
    `;

    const queryParams: (string | number)[] = [];

    // Apply filters
    if (searchQuery) {
      query += ` AND (
        p.property_name LIKE ? OR 
        p.city LIKE ? OR 
        p.street LIKE ? OR 
        p.province LIKE ? OR
        u.unit_name LIKE ?
      )`;
      const likeQuery = `%${searchQuery}%`;
      queryParams.push(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
    }

    if (propertyType) {
      query += ` AND p.property_type = ?`;
      queryParams.push(propertyType);
    }

    if (furnishing) {
      query += ` AND u.furnish = ?`;
      queryParams.push(furnishing);
    }

    if (minPrice) {
      query += ` AND u.rent_amount >= ?`;
      queryParams.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ` AND u.rent_amount <= ?`;
      queryParams.push(Number(maxPrice));
    }

    if (minSize) {
      query += ` AND u.unit_size >= ?`;
      queryParams.push(Number(minSize));
    }

    if (location) {
      query += ` AND p.province = ?`;
      queryParams.push(location);
    }

    if (unitStyle) {
      query += ` AND u.unit_style = ?`;
      queryParams.push(unitStyle);
    }

    query += ` GROUP BY u.unit_id ORDER BY u.rent_amount ASC;`;

    // Execute query
    const result = await db.execute(query, queryParams);
    const units = Array.isArray(result[0]) ? result[0] : [];

    // Process and decrypt photos
    const processedUnits = units.map((unit: any) => {
      // Decrypt unit photos
      let photos: string[] = [];
      if (unit.encrypted_unit_photos) {
        try {
          const photoUrls = unit.encrypted_unit_photos.split(",");
          photos = photoUrls
            .map((encryptedPhoto: string) => {
              try {
                return decryptData(JSON.parse(encryptedPhoto), SECRET_KEY!);
              } catch (err) {
                console.error("Photo decrypt error:", err);
                return null;
              }
            })
            .filter(Boolean);
        } catch (err) {
          console.error("Photo processing error:", err);
        }
      }

      // Return unit with decrypted photos
      return {
        unit_id: unit.unit_id,
        unit_name: unit.unit_name,
        unit_style: unit.unit_style || "",
        unit_size: unit.unit_size,
        rent_amount: unit.rent_amount,
        furnish: unit.furnish,
        amenities: unit.amenities,
        status: unit.status,
        property_id: unit.property_id,
        property_name: unit.property_name,
        property_type: unit.property_type,
        city: unit.city,
        province: unit.province,
        street: unit.street,
        latitude: unit.latitude,
        longitude: unit.longitude,
        flexipay_enabled: unit.flexipay_enabled,
        landlord_id: unit.landlord_id,
        photos: photos,
      };
    });

    // Cache in Redis for 30 seconds
    await redis.set(cacheKey, JSON.stringify(processedUnits), { ex: 30 });

    return NextResponse.json({ data: processedUnits });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { message: "Database Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
