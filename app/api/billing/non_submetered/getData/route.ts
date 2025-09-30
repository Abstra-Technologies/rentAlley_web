
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        if (!property_id) {
            return NextResponse.json(
                { error: "Missing property_id" },
                { status: 400 }
            );
        }

        const [rows]: any = await db.query(
            `
      SELECT 
          la.agreement_id,
          la.unit_id,
          la.tenant_id,
          un.unit_name,
          CONCAT(us.firstName, ' ', us.lastName) AS tenant_name,
          un.rent_amount AS base_rent,
          COALESCE(SUM(
            CASE 
              WHEN e.frequency = 'monthly' THEN e.amount
              ELSE 0
            END
          ), 0) AS additional_charges,
          (un.rent_amount + COALESCE(SUM(
            CASE 
              WHEN e.frequency = 'monthly' THEN e.amount
              ELSE 0
            END
          ), 0)) AS total
      FROM LeaseAgreement la
      JOIN Unit un ON la.unit_id = un.unit_id
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN User us ON t.user_id = us.user_id
      LEFT JOIN LeaseAdditionalExpense e ON la.agreement_id = e.agreement_id
      JOIN Property p ON un.property_id = p.property_id
      WHERE la.status = 'active'
        AND p.property_id = ?
        AND (p.water_billing_type != 'submetered' OR p.electricity_billing_type != 'submetered')
      GROUP BY la.agreement_id, la.unit_id, la.tenant_id, un.rent_amount, us.firstName, us.lastName, un.unit_name
      `,
            [property_id]
        );

        return NextResponse.json({ bills: rows || [] });
    } catch (error: any) {
        console.error("Error fetching non-submetered billing:", error);
        return NextResponse.json(
            { error: "Failed to fetch non-submetered billing data" },
            { status: 500 }
        );
    }
}
