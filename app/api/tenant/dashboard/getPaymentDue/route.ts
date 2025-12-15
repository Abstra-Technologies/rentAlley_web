import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    console.log("🔍 [PaymentDue API] agreement_id:", agreement_id);

    if (!agreement_id) {
        console.warn("❌ agreement_id missing");
        return NextResponse.json(
            { error: "Agreement ID is required" },
            { status: 400 }
        );
    }

    try {
        /* -------------------------------------------------
           1️⃣ Resolve lease + unit (DEBUG)
        ------------------------------------------------- */
        const [leaseRows]: any = await db.execute(
            `
            SELECT agreement_id, unit_id
            FROM LeaseAgreement
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        console.log("🧠 Lease rows:", leaseRows);

        if (!leaseRows.length) {
            console.warn("❌ No lease found for agreement");
            return NextResponse.json(
                { error: "Lease not found" },
                { status: 404 }
            );
        }

        const { unit_id } = leaseRows[0];

        console.log("✅ unit_id resolved:", unit_id);

        /* -------------------------------------------------
           2️⃣ DEBUG: show ALL billings for this lease
        ------------------------------------------------- */
        const [allBills]: any = await db.execute(
            `
            SELECT billing_id, lease_id, unit_id, status, due_date, total_amount_due
            FROM Billing
            WHERE lease_id = ?
            ORDER BY due_date ASC
            `,
            [agreement_id]
        );

        console.log("📦 ALL bills for this agreement:", allBills);

        /* -------------------------------------------------
           3️⃣ Fetch ONE pending / overdue & due bill (CORRECT)
        ------------------------------------------------- */
        const [billingRows]: any = await db.execute(
            `
            SELECT
                billing_id,
                total_amount_due,
                due_date,
                status
            FROM Billing
            WHERE lease_id = ?
              AND status IN ('unpaid', 'overdue')
              AND due_date <= CURRENT_DATE()
              AND total_amount_due > 0
            ORDER BY due_date ASC
            LIMIT 1
            `,
            [agreement_id]
        );

        console.log("🚨 Matched overdue/pending bill:", billingRows);

        if (!billingRows.length) {
            console.log("✅ No pending / overdue bills");
            return NextResponse.json({ billing: null });
        }

        return NextResponse.json({
            billing: {
                billing_id: billingRows[0].billing_id,
                total_due: Number(billingRows[0].total_amount_due),
                due_date: billingRows[0].due_date,
                status: billingRows[0].status,
            },
        });
    } catch (err) {
        console.error("❌ Error fetching payment due:", err);
        return NextResponse.json(
            { error: "Failed to fetch payment due" },
            { status: 500 }
        );
    }
}
