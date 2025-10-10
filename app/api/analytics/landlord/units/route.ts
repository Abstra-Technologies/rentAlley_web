import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");

        if (!landlordId) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        const [rows]: any = await db.query(
            `
      SELECT u.unit_id, u.unit_name, u.furnish, u.status, 
             u.property_id, p.property_name
      FROM Unit u
      INNER JOIN Property p ON p.property_id = u.property_id
      WHERE p.landlord_id = ?
      `,
            [landlordId]
        );

        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Error fetching landlord unit distribution:", error);
        return NextResponse.json(
            { error: "Failed to fetch landlord unit data" },
            { status: 500 }
        );
    }
}
