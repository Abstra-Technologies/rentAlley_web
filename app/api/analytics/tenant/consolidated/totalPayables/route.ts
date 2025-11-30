import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    const tenant_id = req.nextUrl.searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json(
            { error: "tenant_id is required" },
            { status: 400 }
        );
    }

    try {
        // 🔹 Get all active leases
        const [leases]: any[] = await db.query(
            `
                SELECT
                    la.unit_id,
                    la.security_deposit_amount,
                    la.advance_payment_amount,
                
                    u.unit_name,
                    p.property_id,
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

        const details = await Promise.all(
            leases.map(async (lease: any) => {
                // 🔹 Get property configuration
                const [configRows]: any[] = await db.query(
                    `
                        SELECT
                            billingDueDay,
                            lateFeeType,
                            lateFeeAmount,
                            gracePeriodDays
                        FROM PropertyConfiguration
                        WHERE property_id = ?
                        LIMIT 1
                    `,
                    [lease.property_id]
                );

                const config = configRows?.[0] || {};
                const billingDueDay = Number(config.billingDueDay || 1);
                const feeType = config.lateFeeType || "fixed";
                const feeAmount = Number(config.lateFeeAmount || 0);
                const graceDays = Number(config.gracePeriodDays || 0);

                // 🔹 Get all billings for the unit
                const [billings]: any[] = await db.query(
                    `
                        SELECT billing_id, billing_period, total_amount_due, status
                        FROM Billing
                        WHERE unit_id = ? AND status IN ('unpaid', 'overdue')
                        ORDER BY billing_period DESC
                    `,
                    [lease.unit_id]
                );

                let total_due = 0;

                // 🔹 Compute due_date per billing_period only (no penalty)
                const billing_details = billings.map((b: any) => {
                    const billingPeriod = new Date(b.billing_period);
                    const year = billingPeriod.getFullYear();
                    const month = billingPeriod.getMonth();

                    // ✅ compute due date based on billingDueDay
                    const computedDueDate = new Date(year, month, billingDueDay);
                    const due_date_str = computedDueDate.toLocaleDateString("en-CA");

                    total_due += Number(b.total_amount_due || 0);

                    return {
                        ...b,
                        billing_due_date: due_date_str,
                        days_late: 0,
                        days_beyond_grace: 0,
                        penalty: 0,
                        total_with_penalty: Number(b.total_amount_due || 0),
                    };
                });

                return {
                    property_id: lease.property_id,
                    property_name: lease.property_name,
                    unit_id: lease.unit_id,
                    unit_name: lease.unit_name,
                    billing_due_day: billingDueDay,
                    grace_period_days: graceDays,
                    late_fee_type: feeType,
                    late_fee_amount: feeAmount,
                    total_due,
                    billing_details,
                };
            })
        );

        const total = details.reduce((sum, unit) => sum + unit.total_due, 0);

        return NextResponse.json({ total, details }, { status: 200 });
    } catch (error: any) {
        console.error("❌ Error fetching tenant payables:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
