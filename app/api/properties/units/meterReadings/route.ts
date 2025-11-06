import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route GET /api/landlord/meter/getReadingsByUnit?unit_id=123
 * @desc Fetch latest meter readings for a specific unit
 * @returns { water/electricity readings + dynamic concessionaire rates }
 */

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get("unit_id");

    if (!unitId) {
        return NextResponse.json({ error: "Missing unit_id parameter" }, { status: 400 });
    }

    try {
        // 🔎 1️⃣ Find property_id from the unit
        const [unitRows]: any = await db.query(
            `SELECT property_id FROM Unit WHERE unit_id = ? LIMIT 1`,
            [unitId]
        );
        if (!unitRows.length) {
            return NextResponse.json(
                { error: "Unit not found or invalid." },
                { status: 404 }
            );
        }
        const propertyId = unitRows[0].property_id;

        // 💡 2️⃣ Get latest concessionaire rates for the property
        const [concessionaireRows]: any = await db.query(
            `
      SELECT 
        water_total / NULLIF(water_consumption, 0) AS water_rate,
        electricity_total / NULLIF(electricity_consumption, 0) AS electricity_rate,
        billing_period
      FROM ConcessionaireBilling
      WHERE property_id = ?
      ORDER BY billing_period DESC
      LIMIT 1
    `,
            [propertyId]
        );
        const concessionaire =
            concessionaireRows[0] || {
                water_rate: 0,
                electricity_rate: 0,
                billing_period: null,
            };

        // 🔌 3️⃣ Fetch all meter readings for that unit (sorted by newest first)
        const [readings]: any = await db.query(
            `
      SELECT 
        reading_id,
        unit_id,
        utility_type,
        reading_date,
        previous_reading,
        current_reading,
        created_at,
        updated_at
      FROM MeterReading
      WHERE unit_id = ?
      ORDER BY reading_date DESC, created_at DESC
    `,
            [unitId]
        );

        // 🧮 4️⃣ Combine with concessionaire rates dynamically
        const readingsWithRates = readings.map((r: any) => ({
            ...r,
            water_rate:
                r.utility_type === "water" ? concessionaire.water_rate || 0 : null,
            electricity_rate:
                r.utility_type === "electricity"
                    ? concessionaire.electricity_rate || 0
                    : null,
            concessionaire_period: concessionaire.billing_period,
        }));

        // 🧩 5️⃣ Return structured data
        return NextResponse.json(
            {
                message: "Meter readings fetched successfully.",
                property_id: propertyId,
                concessionaire_rates: concessionaire,
                readings: readingsWithRates,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Error fetching meter readings:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
