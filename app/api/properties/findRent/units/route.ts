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

  const cacheKey = `units:${searchQuery || "any"}:${propertyType || "any"}:${
    furnishing || "any"
  }:${minPrice || 0}:${maxPrice || 0}:${minSize || 0}`;

  await redis.del(cacheKey);

  if (!SECRET_KEY) {
    console.error(
      "FATAL: ENCRYPTION_SECRET is not set in environment variables."
    );
    return NextResponse.json(
      { success: false, message: "Server configuration error." },
      { status: 500 }
    );
  }

  try {
    let query = `
      SELECT
        u.unit_id,
        u.property_id,
        u.unit_name,
        u.unit_size,
        u.rent_amount,
        u.furnish,
        u.status,
        p.property_name,
        p.property_type,
        p.city,
        p.province,
        p.street,
        p.flexipay_enabled,
        p.latitude,
        p.longitude,
        l.landlord_id,
        usr.firstName AS enc_landlord_firstName,
        usr.lastName AS enc_landlord_lastName,
        (SELECT photo_url FROM UnitPhoto up WHERE up.unit_id = u.unit_id LIMIT 1) AS encrypted_unit_photo
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      JOIN PropertyVerification pv ON p.property_id = pv.property_id
      JOIN Landlord l ON p.landlord_id = l.landlord_id          
      JOIN User usr ON l.user_id = usr.user_id                  
      WHERE pv.status = 'Verified'
        AND p.status = 'active'
        AND u.status = 'unoccupied'
    `;

    const queryParams: (string | number)[] = [];

    if (searchQuery) {
      query += ` AND (p.property_name LIKE ? OR p.city LIKE ? OR p.street LIKE ? OR p.province LIKE ?)`;
      const likeQuery = `%${searchQuery}%`;
      queryParams.push(likeQuery, likeQuery, likeQuery, likeQuery);
    }

    if (propertyType) {
      query += ` AND p.property_type = ?`;
      queryParams.push(propertyType);
    }

    if (furnishing) {
      query += ` AND u.furnish = ?`;
      queryParams.push(furnishing);
    }

    if (minPrice && Number(minPrice) > 0) {
      query += ` AND u.rent_amount >= ?`;
      queryParams.push(Number(minPrice));
    }

    if (maxPrice && Number(maxPrice) > 0) {
      query += ` AND u.rent_amount <= ?`;
      queryParams.push(Number(maxPrice));
    }

    if (minSize && Number(minSize) > 0) {
      query += ` AND u.unit_size >= ?`;
      queryParams.push(Number(minSize));
    }

    query += ` ORDER BY u.rent_amount ASC;`;

    console.log("🔍 Executing query with filters:", {
      searchQuery,
      propertyType,
      furnishing,
      minPrice,
      maxPrice,
      minSize,
    });

    const [result] = await db.execute(query, queryParams);
    const units = Array.isArray(result) ? result : [];

    console.log(` Units API: Found ${units.length} unoccupied units`);

    if (units.length > 0) {
      console.log(
        " Sample units:",
        units.slice(0, 3).map((u: any) => ({
          id: u.unit_id,
          name: u.unit_name,
          status: u.status,
          property: u.property_name,
        }))
      );
    }

    // Transform and Decrypt data
    const decryptedUnits = units.map((unit: any) => {
      // Decrypt unit photo
      const decryptedPhoto = unit.encrypted_unit_photo
        ? decryptData(JSON.parse(unit.encrypted_unit_photo), SECRET_KEY!)
        : null;
      
      // Decrypt landlord name
      let landlordFirstName = "";
      let landlordLastName = "";

      if (unit.property_id === 26) {
        console.log("DB RAW CHECK - Property ID 26:", {
            description: unit.description,
            unit_name: unit.unit_name
        });
    }
      try {
        if (unit.enc_landlord_firstName) {
          // @ts-ignore
          landlordFirstName = decryptData(JSON.parse(unit.enc_landlord_firstName), SECRET_KEY!);
        }
        if (unit.enc_landlord_lastName) {
          // @ts-ignore
          landlordLastName = decryptData(JSON.parse(unit.enc_landlord_lastName), SECRET_KEY!);
        }
      } catch (err) {
        console.error("Decryption failed for landlord name on unit:", unit.unit_id, err);
      }

      return {
        unit_id: unit.unit_id,
        property_id: unit.property_id,
        unit_name: unit.unit_name,
        unit_size: unit.unit_size,
        rent_amount: unit.rent_amount,
        furnish: unit.furnish,
        status: unit.status,
        property_name: unit.property_name,
        property_type: unit.property_type,
        city: unit.city,
        province: unit.province,
        street: unit.street,
        flexipay_enabled: unit.flexipay_enabled,
        latitude: parseFloat(String(unit.latitude).trim()),
        longitude: parseFloat(String(unit.longitude).trim()),
        landlord_id: unit.landlord_id,
        landlord_firstName: landlordFirstName,
        landlord_lastName: landlordLastName,
        // Unit Photo
        photos: decryptedPhoto ? [decryptedPhoto] : [],
      };
    });

    // Cache results
    await redis.set(cacheKey, JSON.stringify(decryptedUnits), { ex: 10 });

    return NextResponse.json({
      success: true,
      data: decryptedUnits,
    });
  } catch (error) {
    console.error(" Error fetching units:", error);
    return NextResponse.json(
      { success: false, message: "Database Server Error" },
      { status: 500 }
    );
  }
}