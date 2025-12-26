import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    context: { params: Promise<{ landlord_id: string }> }
) {
    const { landlord_id } = await context.params;

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Invalid landlord_id" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
            SELECT status
            FROM LandlordVerification
            WHERE landlord_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [landlord_id]
        );

        // No submission yet
        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { status: "not verified" },
                { status: 200 }
            );
        }

        const dbStatus = rows[0].status ?? "not verified";

        return NextResponse.json(
            { status: dbStatus },
            { status: 200 }
        );
    } catch (error) {
        console.error("Landlord profile status error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
