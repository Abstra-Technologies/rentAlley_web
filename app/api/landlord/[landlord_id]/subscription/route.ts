
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: { landlord_id: string } }
) {
    try {
        const [rows] = await db.query(
            `SELECT 
        subscription_id,
        plan_name,
        start_date,
        end_date,
        payment_status,
        request_reference_number,
        is_trial,
        amount_paid
      FROM Subscription
      WHERE landlord_id = ?
        AND is_active = 0
      ORDER BY end_date DESC`,
            [params.landlord_id]
        );

        return NextResponse.json(rows);
    } catch (err: any) {
        console.error("Error fetching past subscriptions:", err);
        return NextResponse.json(
            { error: "Database query failed" },
            { status: 500 }
        );
    }
}
