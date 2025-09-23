import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

// POST - Save billing
export async function POST(req: NextRequest) {
  try {
    const { id, billingPeriod, electricityTotal, electricityRate, waterTotal, waterRate } = await req.json();

    if (!id || !billingPeriod) {
      return NextResponse.json({ error: "Property ID and Billing Period are required" }, { status: 400 });
    }

    await db.execute(
        `INSERT INTO ConcessionaireBilling 
       (property_id, billing_period, electricity_total, electricity_consumption, water_total, water_consumption, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          id,
          billingPeriod,
          electricityTotal || null,
          electricityRate || null,
          waterTotal || null,
          waterRate || null,
        ]
    );

    return NextResponse.json({ message: "Billing record saved successfully" }, { status: 201 });
  } catch (error) {
    console.error("Billing Save Error:", error);
    return NextResponse.json({ error: `Database Server Error: ${error}` }, { status: 500 });
  }
}

// PUT - Update billing
export async function PUT(req: NextRequest) {
  try {
    const { id, billingPeriod, electricityTotal, electricityRate, waterTotal, waterRate } = await req.json();

    if (!id || !billingPeriod) {
      return NextResponse.json({ error: "Property ID and Billing Period are required" }, { status: 400 });
    }

    await db.execute(
        `UPDATE ConcessionaireBilling 
       SET electricity_total = ?, electricity_consumption = ?, 
           water_total = ?, water_consumption = ?, 
           updated_at = NOW()
       WHERE property_id = ? AND billing_period = ?`,
        [
          electricityTotal || null,
          electricityRate || null,
          waterTotal || null,
          waterRate || null,
          id,
          billingPeriod,
        ]
    );

    return NextResponse.json({ message: "Billing record updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Billing Update Error:", error);
    return NextResponse.json({ error: `Database Server Error: ${error}` }, { status: 500 });
  }
}

// Getting Rates
export async function GET(req:NextRequest) {
  const { searchParams } = new URL(req.url);
  const property_id = searchParams.get("id");

  if (!property_id) {
    return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
  }

  try {
    const [billings] = await db.execute(
      `SELECT utility_type, total_billed_amount, rate_consumed, billing_period, created_at
       FROM ConcessionaireBilling
       WHERE property_id = ?
         AND created_at = (
           SELECT MAX(created_at)
           FROM ConcessionaireBilling
           WHERE property_id = ?
           AND utility_type = ConcessionaireBilling.utility_type
         )`,
      [property_id, property_id]
    );

    return NextResponse.json(Array.isArray(billings) ? billings : [], { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: `Database Server Error: ${error}` }, { status: 500 });
  }
}
