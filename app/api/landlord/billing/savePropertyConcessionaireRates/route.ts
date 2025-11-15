import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";


export async function POST(req: NextRequest) {
    try {
        const {
            property_id,
            period_start,
            period_end,
            electricityTotal,
            electricityConsumption,
            waterTotal,
            waterConsumption,
        } = await req.json();

        if (!property_id || !period_start || !period_end) {
            return NextResponse.json(
                { error: "Property ID, Period Start and Period End are required" },
                { status: 400 }
            );
        }

        // Check if record exists for same property + exact reading period
        const [existing]: any = await db.query(
            `
            SELECT bill_id 
            FROM ConcessionaireBilling 
            WHERE property_id = ? 
              AND period_start = ? 
              AND period_end = ?
            LIMIT 1
            `,
            [property_id, period_start, period_end]
        );

        if (existing.length > 0) {
            // UPDATE existing
            await db.execute(
                `
                UPDATE ConcessionaireBilling
                SET 
                  electricity_total = ?,
                  electricity_consumption = ?,
                  water_total = ?,
                  water_consumption = ?,
                  updated_at = NOW()
                WHERE property_id = ? 
                  AND period_start = ?
                  AND period_end = ?
                `,
                [
                    parseFloat(electricityTotal) || 0,
                    parseFloat(electricityConsumption) || 0,
                    parseFloat(waterTotal) || 0,
                    parseFloat(waterConsumption) || 0,
                    property_id,
                    period_start,
                    period_end,
                ]
            );

            return NextResponse.json(
                { message: "Billing record updated successfully" },
                { status: 200 }
            );
        }

        // INSERT new record
        await db.execute(
            `
            INSERT INTO ConcessionaireBilling
            (property_id, period_start, period_end, 
             electricity_total, electricity_consumption,
             water_total, water_consumption, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `,
            [
                property_id,
                period_start,
                period_end,
                parseFloat(electricityTotal) || 0,
                parseFloat(electricityConsumption) || 0,
                parseFloat(waterTotal) || 0,
                parseFloat(waterConsumption) || 0,
            ]
        );

        return NextResponse.json(
            { message: "Billing record created successfully" },
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

        const [billings]: any = await db.execute(
            `
            SELECT 
              bill_id,
              property_id,
              period_start,
              period_end,
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


