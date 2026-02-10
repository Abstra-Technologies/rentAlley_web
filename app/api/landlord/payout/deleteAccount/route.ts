import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest) {
    let connection: any;

    try {
        const body = await req.json();

        const {
            payout_id,
            landlord_id,
        } = body;

        /* ================= VALIDATION ================= */
        if (!payout_id || !landlord_id) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        /* ================= OWNERSHIP + ACTIVE CHECK ================= */
        const [rows]: any = await connection.query(
            `
            SELECT payout_id, is_active
            FROM LandlordPayoutAccount
            WHERE payout_id = ?
              AND landlord_id = ?
            LIMIT 1
            `,
            [payout_id, landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "Payout account not found." },
                { status: 404 }
            );
        }

        if (rows[0].is_active === 1) {
            return NextResponse.json(
                { error: "Active payout account cannot be deleted." },
                { status: 409 }
            );
        }

        /* ================= DELETE ================= */
        await connection.query(
            `
            DELETE FROM LandlordPayoutAccount
            WHERE payout_id = ?
            `,
            [payout_id]
        );

        return NextResponse.json(
            { success: true, message: "Payout account deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("deleteAccount error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
