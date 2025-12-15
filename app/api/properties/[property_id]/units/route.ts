import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ property_id: string }> }
) {
    try {
        const { property_id: propertyId } = await params;

        console.log("propertyId:", propertyId);

        if (!propertyId) {
            return NextResponse.json(
                { success: false, error: "Missing propertyId" },
                { status: 400 }
            );
        }

        const [rows]: any = await db.query(
            `
        SELECT 
          u.unit_id,
          u.unit_name,
          u.status,
          u.rent_amount,
          u.unit_size,
          u.furnish,
          u.amenities
        FROM Unit u
        WHERE u.property_id = ?
        ORDER BY u.unit_id
      `,
            [propertyId]
        );

        return NextResponse.json({
            success: true,
            data: rows ?? [],
        });
    } catch (error) {
        console.error("Error fetching property units:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
