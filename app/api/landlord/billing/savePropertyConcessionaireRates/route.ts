import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

/**
 * POST - Create new concessionaire billing for submetered property
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

        // ✅ Prevent duplicate record for same property + period
        const [existing]: any = await db.query(
            `SELECT billing_id FROM ConcessionaireBilling WHERE property_id = ? AND billing_period = ? LIMIT 1`,
            [property_id, billingPeriod]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { message: "Billing record already exists for this month. Please use update instead." },
                { status: 409 }
            );
        }

        // ✅ Insert new record
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
            { message: "Billing record saved successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Billing Save Error:", error);
        return NextResponse.json(
            { error: `Database Server Error: ${error}` },
            { status: 500 }
        );
    }
}

/**
 * PUT - Update existing concessionaire billing
 */
export async function PUT(req: NextRequest) {
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

        // ✅ Update existing record
        const [result]: any = await db.execute(
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

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: "No existing billing found for this property and month." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Billing record updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Billing Update Error:", error);
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
