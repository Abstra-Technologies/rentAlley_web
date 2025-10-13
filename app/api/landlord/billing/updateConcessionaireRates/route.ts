import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            property_id,
            billingPeriod,
            electricityTotal,
            electricityConsumption,
            waterTotal,
            waterConsumption,
        } = body;

        // ✅ Basic validation
        if (!property_id || !billingPeriod) {
            return NextResponse.json(
                { error: "Property ID and Billing Period are required." },
                { status: 400 }
            );
        }

        // ✅ Clean numeric parsing (never NaN)
        const safeNumber = (val: any): number => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        const eTotal = safeNumber(electricityTotal);
        const eCons = safeNumber(electricityConsumption);
        const wTotal = safeNumber(waterTotal);
        const wCons = safeNumber(waterConsumption);

        // ✅ Check if record exists
        const [existingRows]: any = await db.query(
            `
                SELECT bill_id FROM ConcessionaireBilling
                WHERE property_id = ? AND billing_period = ?
                LIMIT 1
            `,
            [property_id, billingPeriod]
        );

        if (existingRows.length === 0) {
            // 🔹 Create new record if not existing
            const [insertResult]: any = await db.query(
                `
                    INSERT INTO ConcessionaireBilling (
                        property_id, billing_period,
                        electricity_total, electricity_consumption,
                        water_total, water_consumption,
                        created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                `,
                [property_id, billingPeriod, eTotal, eCons, wTotal, wCons]
            );

            return NextResponse.json({
                message: "New concessionaire billing created successfully.",
                inserted_id: insertResult.insertId,
            });
        }

        // 🔹 Update existing record
        const bill_id = existingRows[0].bill_id;

        await db.query(
            `
                UPDATE ConcessionaireBilling
                SET
                    electricity_total = ?,
                    electricity_consumption = ?,
                    water_total = ?,
                    water_consumption = ?,
                    updated_at = NOW()
                WHERE bill_id = ?
            `,
            [eTotal, eCons, wTotal, wCons, bill_id]
        );

        // ✅ Return updated record
        const [updatedRows]: any = await db.query(
            `
                SELECT bill_id, billing_period,
                       electricity_total, electricity_consumption,
                       water_total, water_consumption
                FROM ConcessionaireBilling
                WHERE bill_id = ?
            `,
            [bill_id]
        );

        return NextResponse.json({
            message: "Concessionaire billing updated successfully.",
            billing: updatedRows[0],
        });
    } catch (error: any) {
        console.error("Database Error (updateConcessionaireRates):", error);
        return NextResponse.json(
            { error: "Database server error", details: error.message },
            { status: 500 }
        );
    }
}
