
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

        if (!property_id || !billingPeriod) {
            return NextResponse.json(
                { error: "Property ID and Billing Period are required" },
                { status: 400 }
            );
        }

        // Find billing record for this property and period
        const [rows]: any = await db.query(
            `
      SELECT bill_id FROM ConcessionaireBilling
      WHERE property_id = ? AND billing_period = ?
      LIMIT 1
      `,
            [property_id, billingPeriod]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "No billing record found for this period" },
                { status: 404 }
            );
        }

        const bill_id = rows[0].bill_id;

        // Update both water + electricity in one row
        await db.query(
            `
      UPDATE ConcessionaireBilling
      SET electricity_total = ?, electricity_consumption = ?,
          water_total = ?, water_consumption = ?,
          updated_at = NOW()
      WHERE bill_id = ?
      `,
            [
                electricityTotal || 0,
                electricityConsumption || 0,
                waterTotal || 0,
                waterConsumption || 0,
                bill_id,
            ]
        );

        return NextResponse.json({
            message: "Concessionaire billing updated successfully",
        });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Database server error" },
            { status: 500 }
        );
    }
}
