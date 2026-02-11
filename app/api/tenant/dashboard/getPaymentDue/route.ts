/*USE CASE
*
* components/tenant/analytics-insights/paymentDue.tsx
* */


import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { error: "agreement_id is required" },
            { status: 400 }
        );
    }

    try {
        /* ===============================
           1️⃣ Get billings + grace period
           (schema-correct joins)
        =============================== */
        const [billingRows]: any = await db.execute(
            `
      SELECT
        b.billing_id,
        b.total_amount_due,
        b.due_date,
        COALESCE(pc.gracePeriodDays, 0) AS grace_period_days
      FROM Billing b
      JOIN LeaseAgreement la
        ON la.agreement_id = b.lease_id
      JOIN Unit u
        ON u.unit_id = la.unit_id
      JOIN PropertyConfiguration pc
        ON pc.property_id = u.property_id
      WHERE b.lease_id = ?
        AND b.total_amount_due > 0
      ORDER BY b.due_date ASC
      `,
            [agreement_id]
        );

        if (!billingRows.length) {
            return NextResponse.json({ billing: null });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // timezone-safe

        const results: any[] = [];

        /* ===============================
           2️⃣ Evaluate billing status
        =============================== */
        for (const billing of billingRows) {
            /* ✅ SCHEMA-CORRECT payment check */
            const [paymentRows]: any = await db.execute(
                `
        SELECT payment_id
        FROM Payment
        WHERE agreement_id = ?
          AND payment_type = 'monthly_billing'
          AND payment_status = 'confirmed'
        LIMIT 1
        `,
                [agreement_id]
            );

            const isPaid = paymentRows.length > 0;

            const dueDate = new Date(billing.due_date);
            dueDate.setHours(0, 0, 0, 0);

            const graceDays = Number(billing.grace_period_days || 0);

            const overdueDate = new Date(dueDate);
            overdueDate.setDate(overdueDate.getDate() + graceDays);

            let status: "paid" | "unpaid" | "overdue";
            let daysLate = 0;

            if (isPaid) {
                status = "paid";
            } else if (today > overdueDate) {
                const diffMs = today.getTime() - overdueDate.getTime();
                daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                status = "overdue";
            } else {
                status = "unpaid";
            }

            results.push({
                billing_id: billing.billing_id,
                total_due: Number(billing.total_amount_due),
                due_date: billing.due_date,
                grace_period_days: graceDays,
                overdue_date: overdueDate.toISOString().split("T")[0],
                status,
                days_late: daysLate,
            });
        }

        /* ===============================
           3️⃣ PRIORITY RULE
           - ALL overdue bills first
           - Else latest billing
        =============================== */
        const overdueBills = results.filter(b => b.status === "overdue");

        if (overdueBills.length > 0) {
            return NextResponse.json({ billing: overdueBills });
        }

        return NextResponse.json({
            billing: results[results.length - 1],
        });

    } catch (err) {
        console.error("❌ Error fetching payment due:", err);
        return NextResponse.json(
            { error: "Failed to fetch payment due" },
            { status: 500 }
        );
    }
}
