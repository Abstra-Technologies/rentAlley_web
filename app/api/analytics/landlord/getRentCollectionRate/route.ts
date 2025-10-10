import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        // 💰 Get total rent billed this month (only active leases)
        const [billedRows]: any = await db.execute(
            `
      SELECT 
          IFNULL(SUM(b.total_amount_due), 0) AS total_billed
      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      JOIN LeaseAgreement la ON la.unit_id = u.unit_id
      WHERE p.landlord_id = ?
        AND la.status = 'active'
        AND MONTH(b.billing_period) = MONTH(CURDATE())
        AND YEAR(b.billing_period) = YEAR(CURDATE());
      `,
            [landlord_id]
        );

        // 💵 Get total rent paid this month
        const [paidRows]: any = await db.execute(
            `
      SELECT 
          IFNULL(SUM(pmt.amount_paid), 0) AS total_paid
      FROM Payment pmt
      JOIN LeaseAgreement la ON pmt.agreement_id = la.agreement_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND pmt.payment_type = 'billing'
        AND MONTH(pmt.payment_date) = MONTH(CURDATE())
        AND YEAR(pmt.payment_date) = YEAR(CURDATE())
        AND pmt.payment_status = 'confirmed';
      `,
            [landlord_id]
        );

        const total_billed = billedRows[0]?.total_billed || 0;
        const total_paid = paidRows[0]?.total_paid || 0;

        const rate =
            total_billed > 0 ? ((total_paid / total_billed) * 100).toFixed(2) : 0;

        return NextResponse.json(
            {
                landlord_id,
                total_billed,
                total_paid,
                collection_rate: parseFloat(rate),
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Error fetching rent collection rate:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
