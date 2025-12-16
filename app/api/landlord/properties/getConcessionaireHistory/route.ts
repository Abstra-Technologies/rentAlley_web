import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getConcessionaireBilling = unstable_cache(
    async (propertyId: string) => {
        const [propRows]: any = await db.query(
            `SELECT property_id, property_name 
       FROM Property 
       WHERE property_id = ? 
       LIMIT 1`,
            [propertyId]
        );

        if (!propRows.length) {
            return { notFound: true };
        }

        // 2️⃣ Fetch billing records
        const [billingRows]: any = await db.query(
            `
      SELECT
        bill_id,
        property_id,
        period_start,
        period_end,
        water_consumption,
        water_total,
        electricity_consumption,
        electricity_total,
        water_rate,
        electricity_rate,
        created_at,
        updated_at
      FROM ConcessionaireBilling
      WHERE property_id = ?
      ORDER BY period_start DESC
      `,
            [propertyId]
        );

        // 3️⃣ Compute rates (safe even if stored)
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

        return {
            property: {
                id: propRows[0].property_id,
                name: propRows[0].property_name,
            },
            billings: computedBillings,
        };
    },
    // 🔑 Cache key namespace
    ["concessionaire-billing-history"],
    {
        // ⏱ Revalidate every 5 minutes
        revalidate: 300,
        tags: ["concessionaire-billing"],
    }
);

/* -------------------------------------------------
   GET handler
------------------------------------------------- */
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
        const result = await getConcessionaireBilling(propertyId);

        if ((result as any)?.notFound) {
            return NextResponse.json(
                { error: "Property not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                message: "Concessionaire billing records fetched successfully.",
                property: result.property,
                billings: result.billings,
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
