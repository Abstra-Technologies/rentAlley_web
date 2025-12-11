import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const billing_id = req.nextUrl.searchParams.get("billing_id");

        if (!billing_id) {
            return NextResponse.json({ error: "Missing billing_id" }, { status: 400 });
        }

        // Fetch payment status from Billing table
        const connection = await db.getConnection();

        const [rows]: any = await connection.query(
            `SELECT status FROM Billing WHERE billing_id = ? LIMIT 1`,
            [billing_id]
        );

        connection.release();

        if (!rows.length) {
            return NextResponse.json({ error: "Billing not found" }, { status: 404 });
        }

        return NextResponse.json({ status: rows[0].status });
    } catch (err: any) {
        console.error("Error fetching payment status:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
