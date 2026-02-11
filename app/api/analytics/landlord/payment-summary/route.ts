import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

//  use cases -->  the components/landlord/analytics/PaymentSummaryGrid.tsx

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json(
                { error: "landlord_id is required" },
                { status: 400 }
            );
        }

        /* ===============================
           TOTAL COLLECTED (YTD)
        ================================ */
        const [[collected]]: any = await db.query(
            `
            SELECT COALESCE(SUM(amount_paid), 0) AS totalCollected
            FROM Payment p
            INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
            INNER JOIN Unit u ON la.unit_id = u.unit_id
            INNER JOIN Property pr ON pr.property_id = u.property_id
            WHERE pr.landlord_id = ?
              AND p.payment_status = 'confirmed'
              AND YEAR(p.created_at) = YEAR(CURDATE())
            `,
            [landlord_id]
        );

        /* ===============================
           TOTAL DISBURSED (SUCCEEDED)
        ================================ */
        const [[disbursed]]: any = await db.query(
            `
            SELECT COALESCE(SUM(amount), 0) AS totalDisbursed
            FROM LandlordPayoutHistory
            WHERE landlord_id = ?
              AND status = 'SUCCEEDED'
            `,
            [landlord_id]
        );

        /* ===============================
           PENDING DISBURSEMENTS
        ================================ */
        const [[pending]]: any = await db.query(
            `
                SELECT
                    COALESCE(SUM(net_amount), 0) AS pendingPayouts
                FROM Payment
                WHERE agreement_id IN (
                    SELECT la.agreement_id
                    FROM LeaseAgreement la
                             INNER JOIN Unit u ON u.unit_id = la.unit_id
                             INNER JOIN Property p ON p.property_id = u.property_id
                    WHERE p.landlord_id = ?
                )
                  AND payment_status = 'confirmed'
                  AND payout_status IN ('unpaid', 'in_payout')
            `,
            [landlord_id]
        );


        return NextResponse.json({
            success: true,
            totalCollected: Number(collected.totalCollected),
            totalDisbursed: Number(disbursed.totalDisbursed),
            pendingPayouts: Number(pending.pendingPayouts),
        });
    } catch (err) {
        console.error("❌ [PAYMENT SUMMARY] ERROR:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
