import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

const round4 = (n: number) =>
    Math.round((n + Number.EPSILON) * 10000) / 10000;

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
                { error: "Property ID, period start, and period end are required" },
                { status: 400 }
            );
        }

        const eTotal = Number(electricityTotal) || 0;
        const eCons = Number(electricityConsumption) || 0;
        const wTotal = Number(waterTotal) || 0;
        const wCons = Number(waterConsumption) || 0;

        const electricityRate =
            eTotal > 0 && eCons > 0 ? round4(eTotal / eCons) : null;

        const waterRate =
            wTotal > 0 && wCons > 0 ? round4(wTotal / wCons) : null;

        /* ---------- CHECK EXISTING PERIOD ---------- */
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

        /* ---------- UPDATE ---------- */
        if (existing.length > 0) {
            await db.execute(
                `
                UPDATE ConcessionaireBilling
                SET
                    electricity_total = ?,
                    electricity_consumption = ?,
                    electricity_rate = ?,
                    water_total = ?,
                    water_consumption = ?,
                    water_rate = ?,
                    updated_at = NOW()
                WHERE property_id = ?
                  AND period_start = ?
                  AND period_end = ?
                `,
                [
                    eTotal,
                    eCons,
                    electricityRate,
                    wTotal,
                    wCons,
                    waterRate,
                    property_id,
                    period_start,
                    period_end,
                ]
            );

            return NextResponse.json(
                {
                    message: "Concessionaire rates updated successfully",
                },
                { status: 200 }
            );
        }

        /* ---------- INSERT ---------- */
        await db.execute(
            `
            INSERT INTO ConcessionaireBilling
            (
                property_id,
                period_start,
                period_end,
                electricity_total,
                electricity_consumption,
                electricity_rate,
                water_total,
                water_consumption,
                water_rate,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `,
            [
                property_id,
                period_start,
                period_end,
                eTotal,
                eCons,
                electricityRate,
                wTotal,
                wCons,
                waterRate,
            ]
        );

        return NextResponse.json(
            { message: "Concessionaire rates saved successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Concessionaire Billing UPSERT Error:", error);
        return NextResponse.json(
            { error: "Database server error" },
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

        const [rows]: any = await db.execute(
            `
            SELECT
                bill_id,
                property_id,
                period_start,
                period_end,

                water_consumption,
                water_total,
                water_rate,

                electricity_consumption,
                electricity_total,
                electricity_rate,

                created_at,
                updated_at
            FROM ConcessionaireBilling
            WHERE property_id = ?
            ORDER BY period_start DESC
            LIMIT 1
            `,
            [property_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { billingData: null },
                { status: 200 }
            );
        }

        const row = rows[0];

        return NextResponse.json(
            {
                billingData: {
                    period_start: row.period_start,
                    period_end: row.period_end,

                    water: row.water_total
                        ? {
                            consumption: row.water_consumption,
                            total: row.water_total,
                            rate: row.water_rate,
                        }
                        : null,

                    electricity: row.electricity_total
                        ? {
                            consumption: row.electricity_consumption,
                            total: row.electricity_total,
                            rate: row.electricity_rate,
                        }
                        : null,

                    created_at: row.created_at,
                    updated_at: row.updated_at,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Concessionaire Billing FETCH Error:", error);
        return NextResponse.json(
            { error: "Database server error" },
            { status: 500 }
        );
    }
}
