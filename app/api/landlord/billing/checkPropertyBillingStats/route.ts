import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

// Get property rates for CURRENT MONTH only
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
        electricity_rate,

        water_total,
        water_consumption,
        water_rate
      FROM ConcessionaireBilling
      WHERE property_id = ?
        AND period_start <= LAST_DAY(CURDATE())
        AND period_end >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      ORDER BY period_start DESC
      LIMIT 1
      `,
            [property_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ billingData: null });
        }

        const row = rows[0];

        console.log('billing data rowsa: ', rows);

        return NextResponse.json({
            billingData: {
                period_start: row.period_start,
                period_end: row.period_end,

                electricity: row.electricity_total !== null
                    ? {
                        total: Number(row.electricity_total),
                        consumption: Number(row.electricity_consumption),
                        rate: Number(row.electricity_rate),
                    }
                    : null,

                water: row.water_total !== null
                    ? {
                        total: Number(row.water_total),
                        consumption: Number(row.water_consumption),
                        rate: Number(row.water_rate),
                    }
                    : null,
            },
        });
    } catch (error) {
        console.error("Error fetching billing data:", error);
        return NextResponse.json(
            { error: "Database server error" },
            { status: 500 }
        );
    }
}
