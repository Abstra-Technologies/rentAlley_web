import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
    }

    try {
        const [result] = await db.query(
            `
      SELECT
        -- Total Collected (YTD)
        COALESCE(SUM(
          CASE
            WHEN p.payment_status = 'confirmed'
             AND YEAR(p.payment_date) = YEAR(CURDATE())
            THEN p.amount_paid
            ELSE 0
          END
        ), 0) AS total_collected,

        -- Pending Payouts
        COALESCE(SUM(
          CASE
            WHEN p.payment_status = 'confirmed'
             AND p.payout_status IN ('unpaid', 'in_payout')
            THEN p.amount_paid
            ELSE 0
          END
        ), 0) AS pending_payouts
      FROM Payment p
      JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
      JOIN Unit u ON u.unit_id = la.unit_id
      JOIN Property pr ON pr.property_id = u.property_id
      WHERE pr.landlord_id = ?
      `,
            [landlord_id]
        );

        const [payouts] = await db.query(
            `
      SELECT
        COALESCE(SUM(amount), 0) AS total_disbursed
      FROM LandlordPayoutHistory
      WHERE landlord_id = ?
        AND status = 'completed'
      `,
            [landlord_id]
        );

        // @ts-ignore
        const totalCollected = Number(result[0].total_collected);
        // @ts-ignore
        const totalDisbursed = Number(payouts[0].total_disbursed);
        // @ts-ignore
        const pendingPayouts = Number(result[0].pending_payouts);
        const platformFees = totalCollected * 0.042;

        return NextResponse.json({
            totalCollected,
            totalDisbursed,
            pendingPayouts,
            platformFees,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }
}
