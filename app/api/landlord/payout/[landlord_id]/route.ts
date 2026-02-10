import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ landlord_id: string }> }
) {
    const { landlord_id } = await params;

    console.log("landlord id:", landlord_id);

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
        l.setup_completed,
        p.payout_id,
      
        p.account_name,
        p.account_number,
        p.bank_name,
        p.created_at,
        p.updated_at
      FROM Landlord l
      LEFT JOIN LandlordPayoutAccount p
        ON p.landlord_id = l.landlord_id
      WHERE l.landlord_id = ?
      ORDER BY p.updated_at DESC
      LIMIT 1
      `,
            [landlord_id]
        );

        // No payout yet
        if (!rows || rows.length === 0 || !rows[0].payout_id) {
            return NextResponse.json({
                status: "pending",
                setup_completed: rows?.[0]?.setup_completed ?? 0,
                payout: null,
            });
        }

        // Payout exists
        return NextResponse.json({
            status: "completed",
            setup_completed: rows[0].setup_completed,
            payout: {
                payout_id: rows[0].payout_id,
                payout_method: rows[0].payout_method,
                account_name: rows[0].account_name,
                account_number: rows[0].account_number,
                bank_name: rows[0].bank_name,
                created_at: rows[0].created_at,
                updated_at: rows[0].updated_at,
            },
        });
    } catch (error) {
        console.error("GET payout account error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
