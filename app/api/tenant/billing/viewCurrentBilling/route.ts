import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let agreementId = searchParams.get("agreement_id");
    const userId = searchParams.get("user_id");

    try {
        // 🔹 If no agreementId but userId is provided, get latest agreement
        if (!agreementId && userId) {
            const [agreements]: any = await db.query(
                `SELECT agreement_id
                 FROM LeaseAgreement
                 WHERE tenant_id = ?
                 ORDER BY start_date DESC
                 LIMIT 1`,
                [userId]
            );

            if (!agreements.length) {
                return NextResponse.json(
                    { message: "No lease agreement found for user." },
                    { status: 404 }
                );
            }

            agreementId = agreements[0].agreement_id;
        }

        if (!agreementId) {
            return NextResponse.json(
                { message: "Agreement ID or User ID is required" },
                { status: 400 }
            );
        }

        // 🔹 Get unit + property + lease info
        const [leaseRows]: any = await db.query(
            `SELECT l.unit_id,
                    u.property_id,
                    u.rent_amount,
                    p.water_billing_type,
                    p.electricity_billing_type,
                    p.advance_payment_months,
                    l.advance_payment_amount,
                    l.is_advance_payment_paid
             FROM LeaseAgreement l
                      JOIN Unit u ON l.unit_id = u.unit_id
                      JOIN Property p ON u.property_id = p.property_id
             WHERE l.agreement_id = ?`,
            [agreementId]
        );

        if (!leaseRows.length) {
            return NextResponse.json(
                { message: "Lease agreement not found" },
                { status: 404 }
            );
        }

        const {
            unit_id: unitId,
            property_id,
            rent_amount,
            water_billing_type,
            electricity_billing_type,
            advance_payment_months,
            advance_payment_amount,
            is_advance_payment_paid,
        } = leaseRows[0];

        // 🔹 Compute total advance payment required
        const totalAdvanceRequired = parseFloat(advance_payment_amount || 0) * (advance_payment_months || 0);

        // 🔹 Get latest billing (for current month)
        const [billingRows]: any = await db.query(
            `SELECT * 
       FROM Billing 
       WHERE unit_id = ? 
         AND MONTH(billing_period) = MONTH(CURRENT_DATE())
         AND YEAR(billing_period) = YEAR(CURRENT_DATE())
       LIMIT 1`,
            [unitId]
        );

        const billing = billingRows.length ? billingRows[0] : null;

        // 🔹 Get last 2 meter readings per utility
        const [meterReadings]: any = await db.query(
            `SELECT *
             FROM MeterReading
             WHERE unit_id = ?
             ORDER BY utility_type, reading_date DESC`,
            [unitId]
        );

        const groupedReadings = { water: [], electricity: [] };
        for (const r of meterReadings) {
            if (r.utility_type === "water" && groupedReadings.water.length < 2) {
                groupedReadings.water.push(r);
            }
            if (r.utility_type === "electricity" && groupedReadings.electricity.length < 2) {
                groupedReadings.electricity.push(r);
            }
        }

        // 🔹 Get additional charges for this billing
        let billingAdditionalCharges: any[] = [];
        if (billing) {
            const [charges]: any = await db.query(
                `SELECT * FROM BillingAdditionalCharge WHERE billing_id = ?`,
                [billing.billing_id]
            );
            billingAdditionalCharges = charges;
        }

        // 🔹 Get lease-level additional expenses
        const [leaseExpenses]: any = await db.query(
            `SELECT * FROM LeaseAdditionalExpense WHERE agreement_id = ?`,
            [agreementId]
        );

        return NextResponse.json(
            {
                billing,
                meterReadings: groupedReadings,
                billingAdditionalCharges,
                leaseAdditionalExpenses: leaseExpenses,
                propertyBillingTypes: {
                    water: water_billing_type,
                    electricity: electricity_billing_type,
                },
                breakdown: {
                    base_rent: parseFloat(rent_amount || 0),
                    advance_payment_required: totalAdvanceRequired,
                    advance_payment_amount: parseFloat(advance_payment_amount || 0),
                    advance_months: advance_payment_months,
                    is_advance_payment_paid: !!is_advance_payment_paid,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Billing route error:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
