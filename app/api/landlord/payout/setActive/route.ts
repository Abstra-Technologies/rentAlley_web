import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const body = await req.json();

        const { landlord_id, payout_id } = body;

        /* ================= VALIDATION ================= */
        if (!landlord_id || !payout_id) {
            return NextResponse.json(
                { error: "landlord_id and payout_id are required" },
                { status: 400 }
            );
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        /* ================= DEACTIVATE ALL ================= */
        await connection.query(
            `
      UPDATE LandlordPayoutAccount
      SET is_active = 0,
          updated_at = NOW()
      WHERE landlord_id = ?
      `,
            [landlord_id]
        );

        /* ================= ACTIVATE SELECTED ================= */
        const [result]: any = await connection.query(
            `
      UPDATE LandlordPayoutAccount
      SET is_active = 1,
          updated_at = NOW()
      WHERE payout_id = ?
        AND landlord_id = ?
      `,
            [payout_id, landlord_id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Payout account not found for landlord");
        }

        await connection.commit();

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    } catch (error) {
        if (connection) await connection.rollback();

        console.error("setActive payout error:", error);

        return NextResponse.json(
            { error: "Failed to set active payout account" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
