import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * @route   GET /api/landlord/analytics/leases?landlord_id=123
 * @desc    Returns all active/completed leases under the landlord with end_date
 * @usedBy  LeaseExpiryForecast chart
 */
export async function GET(req: NextRequest) {
    const landlord_id = req.nextUrl.searchParams.get("landlord_id");
    if (!landlord_id)
        return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });

    try {
        const [rows]: any = await db.query(
            `
      SELECT la.agreement_id, la.end_date, la.status, u.unit_name, p.property_name
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ? 
      AND la.status IN ('active', 'expired')
      AND la.end_date IS NOT NULL
      ORDER BY la.end_date ASC
      `,
            [landlord_id]
        );

        return NextResponse.json(rows);
    } catch (err: any) {
        console.error("Error fetching lease expiry data:", err);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
