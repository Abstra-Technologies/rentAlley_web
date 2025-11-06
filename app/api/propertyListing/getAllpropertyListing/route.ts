import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");

        if (!landlordId) {
            return NextResponse.json(
                { error: "landlord_id is required" },
                { status: 400 }
            );
        }

        // ✅ Follows Upkyp schema relations
        const [properties] = await db.query(
            `
      SELECT
        p.*,
        pv.status AS verification_status,

        -- 🏠 Total units per property
        (SELECT COUNT(*) FROM Unit u WHERE u.property_id = p.property_id) AS total_units,

        -- 🟢 Occupied units (active leases)
        (SELECT COUNT(*)
         FROM Unit u
         JOIN LeaseAgreement la ON la.unit_id = u.unit_id
         WHERE u.property_id = p.property_id AND la.status = 'active') AS occupied_units,

        -- 💰 Total income (from all time)
        (
          SELECT COALESCE(SUM(pay.amount_paid), 0)
          FROM Payment pay
          JOIN Billing b ON pay.bill_id = b.billing_id
          JOIN Unit u ON b.unit_id = u.unit_id
          WHERE u.property_id = p.property_id
        ) AS total_income

      FROM Property p
      LEFT JOIN PropertyVerification pv
        ON p.property_id = pv.property_id
      WHERE p.landlord_id = ?
      GROUP BY p.property_id
      `,
            [landlordId]
        );

        return NextResponse.json(properties);
    } catch (error) {
        console.error("Error fetching properties with verification & analytics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
