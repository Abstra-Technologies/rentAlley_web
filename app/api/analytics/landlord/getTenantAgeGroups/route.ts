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
        CASE
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) < 25 THEN '18–24'
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 25 AND 34 THEN '25–34'
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 35 AND 44 THEN '35–44'
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 45 AND 54 THEN '45–54'
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 55 AND 64 THEN '55–64'
          ELSE '65+'
        END AS age_group,
        COUNT(*) AS tenant_count
      FROM Tenant t
      JOIN User u ON t.user_id = u.user_id
      JOIN LeaseAgreement la ON la.tenant_id = t.tenant_id
      JOIN Unit un ON la.unit_id = un.unit_id
      JOIN Property pr ON un.property_id = pr.property_id
      WHERE pr.landlord_id = ?
        AND la.status IN ('active', 'completed')
        AND u.birthDate IS NOT NULL
      GROUP BY age_group
      ORDER BY MIN(TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()));
      `,
            [landlord_id]
        );

        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        console.error("❌ Error fetching tenant age groups:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
