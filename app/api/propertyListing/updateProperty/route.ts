import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { cookies as getCookies } from "next/headers";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const cookies = getCookies();
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");
  const property_id = searchParams.get("property_id");

  if (!property_id) {
    return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
  }

  const connection = await db.getConnection();

  try {
    const [existingRows] = await connection.execute(
      `SELECT * FROM Property WHERE property_id = ?`,
      [property_id]
    );
      // @ts-ignore
    if (!existingRows.length) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await connection.beginTransaction();

    // Clean empty strings
    Object.keys(body).forEach((key) => {
      if (body[key] === undefined || body[key] === "") {
        body[key] = null;
      }
    });

    const {
      propertyName,
      propertyType,
      amenities,
      street,
      brgyDistrict,
      city,
      zipCode,
      province,
      propDesc,
      totalUnits,
      floorArea,
      utilityBillingType,
      minStay,
      assocDues,
      paymentFrequency,
      lateFee,
        flexiPayEnabled,
        paymentMethodsAccepted ,
        propertyPreferences,
    } = body;

      await connection.execute(
          `UPDATE Property SET
                               property_name = ?,
                               property_type = ?,
                               amenities = ?,
                               street = ?,
                               brgy_district = ?,
                               city = ?,
                               zip_code = ?,
                               province = ?,
                               total_units = ?,
                               utility_billing_type = ?,
                               description = ?,
                               floor_area = ?,
                               min_stay = ?,
                               assoc_dues = ?,
                               late_fee = ?,
                               payment_frequency = ?,
                               flexipay_enabled = ?,
                               property_preferences = ?,
                               accepted_payment_methods = ?,
                               updated_at = CURRENT_TIMESTAMP
           WHERE property_id = ?`,
          [
              propertyName,
              propertyType,
              amenities ? amenities.join(",") : null,
              street,
              Number(brgyDistrict),
              city,
              zipCode,
              province,
              totalUnits,
              utilityBillingType,
              propDesc,
              floorArea,
              minStay,
              assocDues,
              lateFee,
              paymentFrequency,
              flexiPayEnabled || false,
              propertyPreferences ? JSON.stringify(propertyPreferences) : null,
              paymentMethodsAccepted ? JSON.stringify(paymentMethodsAccepted) : null,
              property_id,
          ]
      );


// @ts-ignore
    const token = cookies.get("token")?.value;
    if (!token) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    const loggedUser = payload.user_id;

    await db.query(
      "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
      [loggedUser, `Updated Property ${propertyName}`]
    );

    await connection.commit();

    return NextResponse.json({ property_id: property_id, ...body }, { status: 200 });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating property listing:", error);
    return NextResponse.json({ error: "Failed to update property listing" }, { status: 500 });
  } finally {
    connection.release();
  }
}
