import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns tenant's payment behavior and computed delays.
 * Matches schema: rentalley_db.Payment, rentalley_db.Billing, rentalley_db.LeaseAgreement.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const tenant_id = searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json({ error: "Missing tenant_id" }, { status: 400 });
    }

    try {
        const [rows]: any[] = await db.query(
            `
      SELECT 
        p.payment_id,
        p.amount_paid,
        p.payment_status,
        p.payment_date,
        p.payment_method_id,
        b.billing_id,
        b.total_amount_due,
        b.status AS billing_status,
        b.due_date,
        la.agreement_id,
        la.unit_id
      FROM rentalley_db.Payment p
      JOIN rentalley_db.Billing b ON p.bill_id = b.billing_id
      JOIN rentalley_db.LeaseAgreement la ON b.lease_id = la.agreement_id
      WHERE la.tenant_id = ?
      ORDER BY b.due_date DESC;
      `,
            [tenant_id]
        );

        if (!rows.length) {
            return NextResponse.json({
                tenant_id,
                payment_count: 0,
                on_time: 0,
                late: 0,
                missed: 0,
                avg_delay_days: 0,
                message: "No payment history found for this tenant.",
            });
        }

        let onTime = 0;
        let late = 0;
        let missed = 0;
        let totalDelay = 0;
        let delayCount = 0;

        for (const r of rows) {
            const due = new Date(r.due_date);
            const paid = r.payment_date ? new Date(r.payment_date) : null;

            if (!paid || r.payment_status === "cancelled" || r.payment_status === "failed") {
                missed++;
                continue;
            }

            const delay = Math.floor(
                (paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (delay <= 0) {
                onTime++;
            } else if (delay > 0 && delay <= 5) {
                late++;
                totalDelay += delay;
                delayCount++;
            } else {
                missed++;
                totalDelay += delay;
                delayCount++;
            }
        }

        const avgDelay = delayCount ? Math.round(totalDelay / delayCount) : 0;

        return NextResponse.json({
            tenant_id,
            payment_count: rows.length,
            on_time: onTime,
            late,
            missed,
            avg_delay_days: avgDelay,
            data: rows,
        });
    } catch (error: any) {
        console.error("❌ Error fetching payment history:", error);
        return NextResponse.json(
            { error: "Database error", details: error.message },
            { status: 500 }
        );
    }
}
