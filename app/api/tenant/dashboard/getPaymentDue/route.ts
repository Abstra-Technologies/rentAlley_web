import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        console.warn("❌ agreement_id missing");
        return NextResponse.json(
            { error: "Agreement ID is required" },
            { status: 400 }
        );
    }

    try {

        const [leaseRows]: any = await db.execute(
            `
            SELECT agreement_id, unit_id
            FROM LeaseAgreement
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );


        if (!leaseRows.length) {
            console.warn("❌ No lease found for agreement");
            return NextResponse.json(
                { error: "Lease not found" },
                { status: 404 }
            );
        }

        const { unit_id } = leaseRows[0];


        const [allBills]: any = await db.execute(
            `
            SELECT billing_id, lease_id, unit_id, status, due_date, total_amount_due
            FROM Billing
            WHERE lease_id = ?
            ORDER BY due_date ASC
            `,
            [agreement_id]
        );


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


        if (!billingRows.length) {
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
