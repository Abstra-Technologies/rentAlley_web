import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route   GET /api/landlord/pdc/getByLease?lease_id=456
 * @desc    Fetch all PDC records for the given lease that are due in the current month.
 * @usedBy  Landlord → Property → Billing → CreateUnitBillPage
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const leaseId = searchParams.get("lease_id");

    if (!leaseId)
        return NextResponse.json(
            { error: "Missing lease_id parameter" },
            { status: 400 }
        );

    try {
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

        if (!rows.length)
            return NextResponse.json(
                { message: "No PDC found for this lease in the current month." },
                { status: 404 }
            );

        console.log('pdc', rows[0]);

        return NextResponse.json({
            lease_id: leaseId,
            pdcs: rows,
        });
    } catch (err: any) {
        console.error("❌ Error fetching PDC by lease:", err);
        return NextResponse.json(
            { error: "Failed to fetch PDC records", details: err.message },
            { status: 500 }
        );
    }
}
