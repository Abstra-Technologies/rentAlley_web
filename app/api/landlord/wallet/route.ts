// /app/api/landlord/wallet/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const landlord_id = req.nextUrl.searchParams.get("landlord_id");

    if (!landlord_id)
        return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });

    const [rows] = await db.execute(
        `SELECT COALESCE(current_balance, 0) AS totalCredits
     FROM LandlordWallet WHERE landlord_id = ? LIMIT 1`,
        [landlord_id]
    );

    return NextResponse.json(rows[0] || { totalCredits: 0 });
}
