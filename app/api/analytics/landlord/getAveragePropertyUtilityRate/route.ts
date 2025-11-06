import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.execute(
            `
                SELECT
                    pr.property_id,
                    pr.property_name,
                    ROUND(AVG(cb.water_consumption), 2) AS avg_water_consumption,
                    ROUND(AVG(cb.electricity_consumption), 2) AS avg_electricity_consumption
                FROM ConcessionaireBilling cb
                         JOIN Property pr ON cb.property_id = pr.property_id
                WHERE pr.landlord_id = ?
                GROUP BY pr.property_id, pr.property_name
                ORDER BY pr.property_id;
            `,
            [landlord_id]
        );

        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        console.error("❌ Error fetching average consumption:", error);
        return NextResponse.json(
            { message: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
