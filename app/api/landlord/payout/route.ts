import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const landlord_id = req.nextUrl.searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json(
                { error: "Missing landlord_id" },
                { status: 400 }
            );
        }

        const [rows] = await db.query(
            `
      SELECT 
        payout_id,
        landlord_id,
        amount,
        payout_method,
        account_name,
        account_number,
        bank_name,
        status,
        included_payments,
        receipt_url,
        DATE_FORMAT(created_at, '%b %d, %Y') AS date
      FROM LandlordPayoutHistory
      WHERE landlord_id = ?
      ORDER BY payout_id DESC
      `,
            [landlord_id]
        );

        return NextResponse.json({ payouts: rows });
    } catch (err: any) {
        return NextResponse.json(
            { error: "Server error", details: err.message },
            { status: 500 }
        );
    }
}
