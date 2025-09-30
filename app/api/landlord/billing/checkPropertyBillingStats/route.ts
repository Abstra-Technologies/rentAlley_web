
import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

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
        const [rows] = await db.query(
            `
                SELECT billing_period, electricity_total, electricity_consumption,
                       water_total, water_consumption
                FROM ConcessionaireBilling
                WHERE property_id = ?
                  AND DATE_FORMAT(billing_period, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                LIMIT 1
            `,
            [property_id]
        );

        if (!rows || (rows as any[]).length === 0) {
            return NextResponse.json({ billingData: null });
        }

        const row: any = (rows as any[])[0];

        // Normalize response for frontend
        const billingData = {
            billing_period: row.billing_period,
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
