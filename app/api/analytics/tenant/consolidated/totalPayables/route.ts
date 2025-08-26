import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // adjust path to your DB client

export async function GET(req: NextRequest) {
    const tenant_id = req.nextUrl.searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
    }

    try {
        // Fetch active leases for this tenant
        const [leases]: any[] = await db.query(
            `SELECT la.unit_id, la.is_security_deposit_paid, la.is_advance_payment_paid,
                    u.unit_name, u.rent_amount, u.sec_deposit, u.advanced_payment,
                    p.property_name
             FROM LeaseAgreement la
                      JOIN Unit u ON la.unit_id = u.unit_id
                      JOIN Property p ON u.property_id = p.property_id
             WHERE la.tenant_id = ? AND la.status = 'active'`,
            [tenant_id]
        );

        const details = await Promise.all(
            leases.map(async (unit: any) => {
                // Fetch billing details for each unit
                const [billing]: any[] = await db.query(
                    `SELECT billing_id, billing_period, total_amount_due, status, due_date
                     FROM Billing
                     WHERE unit_id = ?`,
                    [unit.unit_id]
                );

                // Compute total due including rent, deposits, and unpaid bills
                let total_due =
                    Number(unit.rent_amount || 0) +
                    (!unit.is_security_deposit_paid ? Number(unit.sec_deposit || 0) : 0) +
                    (!unit.is_advance_payment_paid ? Number(unit.advanced_payment || 0) : 0);


                if (!unit.is_security_deposit_paid && unit.sec_deposit) {
                    total_due += unit.sec_deposit;
                }

                if (!unit.is_advance_payment_paid && unit.advanced_payment) {
                    total_due += unit.advanced_payment;
                }

                // Add unpaid or overdue billing amounts
                total_due += billing
                    .filter((b: any) => b.status !== "paid")
                    .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0);

                return {
                    unit_id: unit.unit_id,
                    unit_name: unit.unit_name,
                    property_name: unit.property_name,
                    rent_amount: unit.rent_amount,
                    sec_deposit: unit.sec_deposit,
                    advanced_payment: unit.advanced_payment,
                    total_due,
                    billing_details: billing
                };
            })
        );

        const total = details.reduce((sum, unit) => sum + Number(unit.total_due || 0), 0);

        return NextResponse.json({ total, details }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
