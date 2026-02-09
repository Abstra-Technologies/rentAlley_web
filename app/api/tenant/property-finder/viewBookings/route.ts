import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");
    const date = searchParams.get("date");

    if (!tenant_id) {
        return NextResponse.json(
            { message: "Tenant ID is required" },
            { status: 400 }
        );
    }

    try {
        const params: any[] = [tenant_id];
        let dateFilter = "";

        if (date) {
            dateFilter = "AND pv.visit_date = ?";
            params.push(date);
        }

        const [visits] = await db.query(
            `
      SELECT 
        pv.visit_id,
        p.property_name,
        u.unit_name,
        pv.visit_date,
        pv.visit_time,
        pv.status,
        pv.disapproval_reason
      FROM PropertyVisit pv
      JOIN Unit u ON pv.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE pv.tenant_id = ?
      ${dateFilter}
      ORDER BY pv.visit_date DESC, pv.visit_time ASC
      `,
            params
        );

        return NextResponse.json(visits, { status: 200 });
    } catch (error) {
        console.error("Error fetching visits:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
