import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

// @method: GET
// Get property concessionaire utility rates for latest reading period

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    if (!property_id) {
        return NextResponse.json(
            { error: "Property ID is required" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
            SELECT 
                bill_id,
                period_start,
                period_end,
                electricity_total,
                electricity_consumption,
                water_total,
                water_consumption
            FROM ConcessionaireBilling
            WHERE property_id = ?
            ORDER BY period_start DESC
            LIMIT 1
            `,
            [property_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ billingData: null });
        }

        const row = rows[0];

        const billingData = {
            period_start: row.period_start,
            period_end: row.period_end,
            electricity: row.electricity_total
                ? {
                    total: row.electricity_total,
                    consumption: row.electricity_consumption,
                }
                : null,
            water: row.water_total
                ? {
                    total: row.water_total,
                    consumption: row.water_consumption,
                }
                : null,
        };

        return NextResponse.json({ billingData });
    } catch (error) {
        console.error("Error fetching billing data:", error);
        return NextResponse.json(
            { error: "Database server error" },
            { status: 500 }
        );
    }
}
