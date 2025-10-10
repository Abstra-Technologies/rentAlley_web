import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const tenant_id = req.nextUrl.searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json(
            { error: "tenant_id is required" },
            { status: 400 }
        );
    }

    try {
        // 🔹 Get all active leases with deposits/advances
        const [leases]: any[] = await db.query(
            `
            SELECT 
                la.unit_id,
                la.security_deposit_amount,
                la.advance_payment_amount,
                la.is_security_deposit_paid,
                la.is_advance_payment_paid,
                u.unit_name,
                p.property_name
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE la.tenant_id = ? AND la.status = 'active'
            `,
            [tenant_id]
        );

        if (!leases.length)
            return NextResponse.json({ total: 0, details: [] }, { status: 200 });

        // 🔹 For each leased unit, pull its Billing records
        const details = await Promise.all(
            leases.map(async (lease: any) => {
                const [billings]: any[] = await db.query(
                    `
                    SELECT 
                        billing_id, billing_period, total_amount_due, status, due_date
                    FROM Billing
                    WHERE unit_id = ?
                    ORDER BY due_date DESC
                    `,
                    [lease.unit_id]
                );

                // Compute total_due (unpaid or overdue + unpaid deposits/advances)
                let total_due = 0;

                total_due += billings
                    .filter((b: any) => b.status !== "paid")
                    .reduce((sum: number, b: any) => sum + Number(b.total_amount_due || 0), 0);

                if (!lease.is_security_deposit_paid && lease.security_deposit_amount) {
                    total_due += Number(lease.security_deposit_amount);
                }

                if (!lease.is_advance_payment_paid && lease.advance_payment_amount) {
                    total_due += Number(lease.advance_payment_amount);
                }

                return {
                    unit_id: lease.unit_id,
                    unit_name: lease.unit_name,
                    property_name: lease.property_name,
                    security_deposit_amount: Number(lease.security_deposit_amount) || 0,
                    advance_payment_amount: Number(lease.advance_payment_amount) || 0,
                    total_due,
                    billing_details: billings,
                };
            })
        );

        const total = details.reduce((sum, unit) => sum + unit.total_due, 0);

        return NextResponse.json({ total, details }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching tenant payables:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
