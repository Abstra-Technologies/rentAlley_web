import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // adjust to your DB helper

export async function GET() {
    try {
        const [rows] = await db.query(
            `
      SELECT 
        channel_code AS code,
        bank_name AS name,
        channel_type
      FROM payout_channels
      WHERE is_available = 1
      ORDER BY bank_name ASC
      `
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Failed to load payout channels:", error);
        return NextResponse.json(
            { message: "Failed to load banks" },
            { status: 500 }
        );
    }
}
