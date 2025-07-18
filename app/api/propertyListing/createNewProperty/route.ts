import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function POST(req) {
  const connection = await db.getConnection();

  try {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");
    if (!landlord_id) {
      return NextResponse.json({ error: "User does not exist" }, { status: 400 });
    }

    const body = await req.json();
    const {
      propertyName,
      propertyType,
      amenities,
      street,
      brgyDistrict,
      city,
      zipCode,
      province,
      totalUnits,
      utilityBillingType,
      propDesc,
      floorArea,
      minStay,
      lateFee,
      assocDues,
      secDeposit,
      advancedPayment,
      paymentFrequency,
      // New fields
      flexiPayEnabled = 0,
      paymentMethodsAccepted = [],
      propertyPreferences = [],
    } = body;

    const values = [
      landlord_id,
      propertyName,
      propertyType,
      amenities ? amenities.join(",") : null,
      street || null,
      parseInt(brgyDistrict) || null,
      city || null,
      zipCode || null,
      province || null,
      totalUnits || 1,
      utilityBillingType,
      propDesc || null,
      floorArea,
      minStay || null,
      lateFee || 0.0,
      assocDues || 0.0,
      secDeposit || null,
      advancedPayment || null,
      paymentFrequency || null,
      flexiPayEnabled,
      JSON.stringify(propertyPreferences || []),
      JSON.stringify(paymentMethodsAccepted || [])
    ];


console.log("paymentMethodsAccepted:", paymentMethodsAccepted);

    await connection.beginTransaction();

   await connection.execute(
      `INSERT INTO Property (
        landlord_id, property_name, property_type, amenities, street,
        brgy_district, city, zip_code, province, total_units,
        utility_billing_type, description, floor_area,
        min_stay, late_fee, assoc_dues, sec_deposit, advanced_payment,
        payment_frequency, flexipay_enabled, property_preferences,accepted_payment_methods,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      values
    );


    await connection.commit();

    return NextResponse.json(
      {
        message: "Property created successfully",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating property listing:", error);
    await connection.rollback();
    return NextResponse.json(
      { error: "Failed to create property listing" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
