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
        const [rows]: any = await db.execute(
            `
      SELECT
          pr.property_id,
          pr.property_name,
          ROUND(AVG(TIMESTAMPDIFF(MONTH, la.start_date, la.end_date)), 1) AS avg_lease_months
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
        AND la.status IN ('active', 'completed', 'expired')
        AND la.start_date IS NOT NULL
        AND la.end_date IS NOT NULL
      GROUP BY pr.property_id, pr.property_name
      ORDER BY pr.property_id;
      `,
            [landlord_id]
        );

        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        console.error("❌ Error fetching average lease duration:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
