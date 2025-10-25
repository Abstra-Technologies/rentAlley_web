import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route GET /api/landlord/concessionaire/getBillingHistory?property_id=123
 * @desc Fetch all concessionaire billing records for a specific property
 * @returns JSON of concessionaire billing records with computed rates
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
        return NextResponse.json(
            { error: "Missing property_id parameter." },
            { status: 400 }
        );
    }

    try {
        // 1️⃣ Verify property exists
        const [propRows]: any = await db.query(
            `SELECT property_id, property_name FROM Property WHERE property_id = ? LIMIT 1`,
            [propertyId]
        );

        if (!propRows.length) {
            return NextResponse.json(
                { error: "Property not found." },
                { status: 404 }
            );
        }

        // 2️⃣ Fetch concessionaire billing records for this property
        const [billingRows]: any = await db.query(
            `
      SELECT 
        bill_id,
        property_id,
        billing_period,
        water_consumption,
        water_total,
        electricity_consumption,
        electricity_total,
        created_at,
        updated_at
      FROM ConcessionaireBilling
      WHERE property_id = ?
      ORDER BY billing_period DESC
      `,
            [propertyId]
        );

        if (!billingRows.length) {
            return NextResponse.json(
                { message: "No concessionaire billing records found.", billings: [] },
                { status: 200 }
            );
        }

        // 3️⃣ Compute rates dynamically
        const computedBillings = billingRows.map((b: any) => {
            const waterRate =
                b.water_consumption && b.water_consumption > 0
                    ? b.water_total / b.water_consumption
                    : 0;
            const electricityRate =
                b.electricity_consumption && b.electricity_consumption > 0
                    ? b.electricity_total / b.electricity_consumption
                    : 0;

            return {
                ...b,
                water_rate: Number(waterRate.toFixed(2)),
                electricity_rate: Number(electricityRate.toFixed(2)),
            };
        });

        return NextResponse.json(
            {
                message: "Concessionaire billing records fetched successfully.",
                property: {
                    id: propRows[0].property_id,
                    name: propRows[0].property_name,
                },
                billings: computedBillings,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Concessionaire Billing API Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
