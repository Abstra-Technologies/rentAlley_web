import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

/**
 * POST - Insert new concessionaire billing, or update if record already exists.
 */
export async function POST(req: NextRequest) {
    try {
        const {
            property_id,
            billingPeriod,
            electricityTotal,
            electricityConsumption,
            waterTotal,
            waterConsumption,
        } = await req.json();

        if (!property_id || !billingPeriod) {
            return NextResponse.json(
                { error: "Property ID and Billing Period are required" },
                { status: 400 }
            );
        }

        // ✅ Check if record already exists for this property and month
        const [existing]: any = await db.query(
            `SELECT bill_id FROM ConcessionaireBilling WHERE property_id = ? AND billing_period = ? LIMIT 1`,
            [property_id, billingPeriod]
        );

        if (existing.length > 0) {
            // 🔁 Record exists — perform UPDATE
            const [updateResult]: any = await db.execute(
                `
        UPDATE ConcessionaireBilling
        SET 
          electricity_total = ?,
          electricity_consumption = ?,
          water_total = ?,
          water_consumption = ?,
          updated_at = NOW()
        WHERE property_id = ? AND billing_period = ?
        `,
                [
                    parseFloat(electricityTotal) || 0,
                    parseFloat(electricityConsumption) || 0,
                    parseFloat(waterTotal) || 0,
                    parseFloat(waterConsumption) || 0,
                    property_id,
                    billingPeriod,
                ]
            );

            return NextResponse.json(
                { message: "Existing billing record updated successfully" },
                { status: 200 }
            );
        }

        // 🆕 Record does not exist — perform INSERT
        await db.execute(
            `
      INSERT INTO ConcessionaireBilling
      (property_id, billing_period, electricity_total, electricity_consumption, water_total, water_consumption, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
            [
                property_id,
                billingPeriod,
                parseFloat(electricityTotal) || 0,
                parseFloat(electricityConsumption) || 0,
                parseFloat(waterTotal) || 0,
                parseFloat(waterConsumption) || 0,
            ]
        );

        return NextResponse.json(
            { message: "New billing record created successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Billing Upsert Error:", error);
        return NextResponse.json(
            { error: `Database Server Error: ${error}` },
            { status: 500 }
        );
    }
}

/**
 * GET - Retrieve the latest concessionaire billing record for a property
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        if (!property_id) {
            return NextResponse.json(
                { error: "Property ID is required" },
                { status: 400 }
            );
        }

        // ✅ Fetch the latest billing record for this property
        const [billings]: any = await db.execute(
            `
      SELECT 
        bill_id,
        property_id,
        billing_period,
        electricity_total,
        electricity_consumption,
        water_total,
        water_consumption,
        created_at,
        updated_at
      FROM ConcessionaireBilling
      WHERE property_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
            [property_id]
        );

        if (billings.length === 0) {
            return NextResponse.json(
                { message: "No billing record found for this property." },
                { status: 404 }
            );
        }

        return NextResponse.json(billings[0], { status: 200 });
    } catch (error) {
        console.error("Billing Fetch Error:", error);
        return NextResponse.json(
            { error: `Database Server Error: ${error}` },
            { status: 500 }
        );
    }
}
