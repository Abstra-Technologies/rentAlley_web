
import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");

    if (!unit_id) {
        return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }

    try {
        const [rows] = await db.query(
            `
      SELECT 
        u.unit_id,
        u.unit_name,
        u.rent_amount,
        u.status,
        p.property_id,
        p.property_name,
        p.street,
        p.city,
        p.province,
        p.electricity_billing_type,
        p.water_billing_type,
        p.landlord_id
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      WHERE u.unit_id = ?
      `,
            [unit_id]
        );

        if (!rows || (rows as any[]).length === 0) {
            return NextResponse.json({ error: "No property found for this unit" }, { status: 404 });
        }

        return NextResponse.json({ propertyDetails: (rows as any[])[0] });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: "Database server error" }, { status: 500 });
    }
}
