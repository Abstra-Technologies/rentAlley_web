import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route   GET /api/landlord/pdc/getByBilling?billing_id=123
 * @desc    Fetch PDC record(s) for a given billing_id (only for current month)
 * @usedBy  Landlord → Property → Billing → CreateUnitBillPage
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const billingId = searchParams.get("billing_id");

    if (!billingId) {
        return NextResponse.json(
            { error: "Missing billing_id parameter" },
            { status: 400 }
        );
    }

    try {
        // 🔍 1️⃣ Find the associated lease_id from Billing
        const [billingRows]: any = await db.query(
            `SELECT lease_id FROM Billing WHERE billing_id = ? LIMIT 1`,
            [billingId]
        );

        if (!billingRows.length) {
            return NextResponse.json(
                { message: "No billing found for this ID" },
                { status: 404 }
            );
        }

        const leaseId = billingRows[0].lease_id;

        // 🔍 2️⃣ Fetch all PDCs linked to this lease for the current month only
        const [rows]: any = await db.query(
            `
                SELECT
                    pdc_id,
                    lease_id,
                    check_number,
                    bank_name,
                    amount,
                    due_date,
                    status,
                    uploaded_image_url,
                    notes,
                    received_at,
                    cleared_at,
                    bounced_at,
                    replaced_by_pdc_id,
                    created_at,
                    updated_at
                FROM PostDatedCheck
                WHERE lease_id = ?
                  AND MONTH(due_date) = MONTH(CURDATE())
                  AND YEAR(due_date) = YEAR(CURDATE())
                ORDER BY due_date ASC
            `,
            [leaseId]
        );

        if (!rows.length) {
            return NextResponse.json(
                { message: "No PDC found for this billing in the current month." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            lease_id: leaseId,
            pdcs: rows,
        });
    } catch (err: any) {
        console.error("❌ Error fetching PDC by billing:", err);
        return NextResponse.json(
            { error: "Failed to fetch PDCs", details: err.message },
            { status: 500 }
        );
    }
}
