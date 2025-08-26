import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenant_id");

    if (!tenantId) {
        return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
    }

    try {
        // Total active rental units for this tenant
        const [activeUnits] = await db.query(
            `
      SELECT COUNT(*) as total_active_units 
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      WHERE la.tenant_id = ? AND la.status = 'active' AND u.status = 'occupied'
      `,
            [tenantId]
        );

        // Small list of active units (latest 5)
        const [unitList] = await db.query(
            `
      SELECT u.unit_name, u.rent_amount, p.property_name
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE la.tenant_id = ? AND la.status = 'active' AND u.status = 'occupied'
      ORDER BY la.start_date DESC
      LIMIT 3
      `,
            [tenantId]
        );

        return NextResponse.json({
            // @ts-ignore
            totalActiveUnits: activeUnits[0]?.total_active_units || 0,
            units: unitList,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
