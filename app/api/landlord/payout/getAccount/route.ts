import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    let connection: any;

    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json(
                { error: "Missing landlord_id" },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        const [rows]: any = await connection.query(
            `SELECT * 
             FROM LandlordPayoutAccount 
             WHERE landlord_id = ?
             LIMIT 1`,
            [landlord_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { account: null },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { account: rows[0] },
            { status: 200 }
        );

    } catch (error) {
        console.error("GET payout account error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );

    } finally {
        if (connection) connection.release();
    }
}
