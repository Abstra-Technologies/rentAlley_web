import { db } from "@/lib/db";
import occupationsList from "@/constant/occupations";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const landlord_id = searchParams.get("landlord_id");

  if (!landlord_id) {
    return NextResponse.json(
      { message: "Missing landlord_id parameter" },
      { status: 400 }
    );
  }

  try {
    const [rows]: any = await db.execute(
        `
          SELECT
            u.occupation,
            COUNT(t.tenant_id) AS tenant_count,
            (COUNT(t.tenant_id) * 100.0 / (
              SELECT COUNT(*)
              FROM Tenant t2
                     JOIN LeaseAgreement la2 ON t2.tenant_id = la2.tenant_id
                     JOIN Unit un2 ON la2.unit_id = un2.unit_id
                     JOIN Property pr2 ON un2.property_id = pr2.property_id
              WHERE pr2.landlord_id = ?
                AND la2.status = 'active'
            )) AS percentage
          FROM Tenant t
                 JOIN User u ON t.user_id = u.user_id
                 JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
                 JOIN Unit un ON la.unit_id = un.unit_id
                 JOIN Property pr ON un.property_id = pr.property_id
          WHERE pr.landlord_id = ?
            AND la.status = 'active'
          GROUP BY u.occupation
          ORDER BY tenant_count DESC;
        `,
        [landlord_id, landlord_id]
    );


    const formattedOccupations = rows.map((item: any) => {
      const occupationLabel =
        occupationsList.find((occ) => occ.value === item.occupation)?.label ||
        item.occupation;

      return {
        occupation: occupationLabel,
        tenant_count: item.tenant_count,
        percentage: item.percentage,
      };
    });

    return NextResponse.json(formattedOccupations);
  } catch (error) {
    console.error("Error fetching tenant occupation analytics:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
