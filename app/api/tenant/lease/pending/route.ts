
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const tenant_id = req.nextUrl.searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const [rows] = await connection.execute(
            `
      SELECT la.agreement_id, la.unit_id, la.start_date, la.end_date, la.status,
             u.unit_name, p.property_name, la.agreement_url
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE la.tenant_id = ? AND la.status = 'pending'
      LIMIT 1
      `,
            [tenant_id]
        );

        if ((rows as any[]).length === 0) {
            return NextResponse.json({ pendingLease: null });
        }

        // @ts-ignore
        return NextResponse.json({ pendingLease: rows[0] });
    } catch (error: any) {
        console.error("Error fetching pending lease:", error);
        return NextResponse.json(
            { error: "Failed to fetch pending lease" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
