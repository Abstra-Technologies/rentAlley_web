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
           1️⃣ Get ALL billings (old → new)
        =============================== */
        const [billingRows]: any = await db.execute(
            `
            SELECT
                billing_id,
                total_amount_due,
                due_date
            FROM Billing
            WHERE lease_id = ?
              AND total_amount_due > 0
            ORDER BY due_date ASC
            `,
            [agreement_id]
        );

        if (!billingRows.length) {
            return NextResponse.json({ billing: null });
        }

        const today = new Date();
        const results: any[] = [];

        /* ===============================
           2️⃣ Evaluate each billing
        =============================== */
        for (const billing of billingRows) {
            // check confirmed payment
            const [paymentRows]: any = await db.execute(
                `
                SELECT payment_id
                FROM Payment
                WHERE bill_id = ?
                  AND payment_status = 'confirmed'
                LIMIT 1
                `,
                [billing.billing_id]
            );

            const isPaid = paymentRows.length > 0;
            const dueDate = new Date(billing.due_date);

            let daysLate = 0;
            let status: "paid" | "unpaid" | "overdue";

            if (isPaid) {
                status = "paid";
            } else if (today > dueDate) {
                const diff = today.getTime() - dueDate.getTime();
                daysLate = Math.ceil(diff / (1000 * 60 * 60 * 24));
                status = "overdue";
            } else {
                status = "unpaid";
            }

            results.push({
                billing_id: billing.billing_id,
                total_due: Number(billing.total_amount_due),
                due_date: billing.due_date,
                status,
                days_late: daysLate,
            });
        }

        /* ===============================
           3️⃣ PRIORITY RULE
           - Overdue first
           - Else latest unpaid
        =============================== */
        const overdueBills = results.filter(b => b.status === "overdue");

        if (overdueBills.length > 0) {
            return NextResponse.json({
                billing: overdueBills, // 👈 ARRAY of overdue bills
            });
        }

        // otherwise return latest bill (paid or unpaid)
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
