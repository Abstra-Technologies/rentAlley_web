import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ landlord_id: string }> }
) {
    const { landlord_id } = await params; // ✅ FIX

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Invalid landlord_id" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
      SELECT
        payout_id,
        payout_method,
        account_name,
        account_number,
        bank_name,
        created_at,
        updated_at
      FROM LandlordPayoutAccount
      WHERE landlord_id = ?
      LIMIT 1
      `,
            [landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { message: "No payout account found" },
                { status: 404 }
            );
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("GET payout account error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
