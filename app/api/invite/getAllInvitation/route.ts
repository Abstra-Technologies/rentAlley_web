import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "Email parameter is required." },
                { status: 400 }
            );
        }

        // Fetch all invites for this email and join related property/unit info
        const [rows]: any = await db.query(
            `
      SELECT 
        ic.code,
        ic.status,
        ic.createdAt,
        ic.expiresAt,
        ic.start_date,
        ic.end_date,
        u.unit_name,
        p.property_name
      FROM InviteCode ic
      JOIN Unit u ON ic.unitId = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE ic.email = ? AND ic.status = 'PENDING'
      ORDER BY ic.createdAt DESC
      `,
            [email]
        );

        const invites = rows.map((row: any) => ({
            code: row.code,
            propertyName: row.property_name,   // Correct key
            unitName: row.unit_name,           // Correct key
            createdAt: row.createdAt,
            expiresAt: row.expiresAt,
            start_date: row.start_date,
            end_date: row.end_date,
            status: row.status,
        }));


        return NextResponse.json({ invites }, { status: 200 });
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
