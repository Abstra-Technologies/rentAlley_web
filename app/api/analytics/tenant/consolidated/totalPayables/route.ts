

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // adjust path

export async function GET(req: NextRequest) {
    const tenant_id = req.nextUrl.searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json(
            { error: "tenant_id is required" },
            { status: 400 }
        );
    }

    try {
        // Fetch active leases for this tenant (with financial terms now in LeaseAgreement)
        const [leases]: any[] = await db.query(
            `SELECT la.unit_id, la.is_security_deposit_paid, la.is_advance_payment_paid,
              la.security_deposit_amount, la.advance_payment_amount,
              u.unit_name, u.rent_amount,
              p.property_name
       FROM LeaseAgreement la
       JOIN Unit u ON la.unit_id = u.unit_id
       JOIN Property p ON u.property_id = p.property_id
       WHERE la.tenant_id = ? AND la.status = 'active'`,
            [tenant_id]
        );

        const details = await Promise.all(
            leases.map(async (unit: any) => {
                // Fetch billing records for this unit
                const [billing]: any[] = await db.query(
                    `SELECT billing_id, billing_period, total_amount_due, status, due_date
           FROM Billing
           WHERE unit_id = ?`,
                    [unit.unit_id]
                );

                // Base rent always due
                let total_due = Number(unit.rent_amount || 0);

                // Add deposits/advance if unpaid
                if (!unit.is_security_deposit_paid && unit.security_deposit_amount) {
                    total_due += Number(unit.security_deposit_amount);
                }

                if (!unit.is_advance_payment_paid && unit.advance_payment_amount) {
                    total_due += Number(unit.advance_payment_amount);
                }

                // Add unpaid or overdue billing
                total_due += billing
                    .filter((b: any) => b.status !== "paid")
                    .reduce(
                        (sum: number, b: any) => sum + Number(b.total_amount_due || 0),
                        0
                    );

                return {
                    unit_id: unit.unit_id,
                    unit_name: unit.unit_name,
                    property_name: unit.property_name,
                    rent_amount: unit.rent_amount,
                    security_deposit_amount: unit.security_deposit_amount,
                    advance_payment_amount: unit.advance_payment_amount,
                    total_due,
                    billing_details: billing,
                };
            })
        );

        const total = details.reduce(
            (sum, unit) => sum + Number(unit.total_due || 0),
            0
        );

        return NextResponse.json({ total, details }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
