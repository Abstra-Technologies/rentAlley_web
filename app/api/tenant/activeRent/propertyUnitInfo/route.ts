// /app/api/tenant/dashboard/propertyUnitInfo/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    console.log('agreemend id inner: ', agreement_id);

    if (!agreement_id)
        return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });

    const [rows]: any = await db.query(
        `
      SELECT p.property_name, u.unit_name
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE la.agreement_id = ?
    `,
        [agreement_id]
    );

    if (!rows.length)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(rows[0]);
}
