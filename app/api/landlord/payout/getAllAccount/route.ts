import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    let connection: any;

    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json(
                { error: "landlord_id is required" },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        const [rows]: any = await connection.query(
            `
            SELECT
                payout_id,
                landlord_id,
                channel_code,
                bank_name,
                account_name,
                account_number,
                is_active,
                created_at,
                updated_at
            FROM LandlordPayoutAccount
            WHERE landlord_id = ?
            ORDER BY is_active DESC, created_at DESC
            `,
            [landlord_id]
        );

        // ✅ NO MASKING — frontend controls visibility
        return NextResponse.json(
            { accounts: rows },
            { status: 200 }
        );
    } catch (error) {
        console.error("getAllAccount error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
