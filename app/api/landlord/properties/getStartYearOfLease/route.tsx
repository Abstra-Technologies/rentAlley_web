import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
        return NextResponse.json(
            { error: "Missing property_id" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
      SELECT DISTINCT YEAR(p.payment_date) AS year
      FROM Payment p
      JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
      JOIN Unit u ON la.unit_id = u.unit_id
      WHERE u.property_id = ?
      ORDER BY year DESC
      `,
            [propertyId]
        );

        const years = rows.map((r: any) => r.year);

        return NextResponse.json({ years });
    } catch (error) {
        console.error("❌ Error fetching payment years:", error);
        return NextResponse.json(
            { error: "Failed to fetch years" },
            { status: 500 }
        );
    }
}
