import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // adjust to your DB helper

export async function GET() {
    try {
        const [rows] = await db.query(
            `
      SELECT 
        channel_code AS code,
        bank_name AS name,
        is_available,
        channel_type
      FROM payout_channels
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

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { channel_code, is_available } = body;

        if (!channel_code || typeof is_available !== "boolean") {
            return NextResponse.json(
                { message: "channel_code and is_available are required" },
                { status: 400 }
            );
        }

        const [result]: any = await db.query(
            `
      UPDATE payout_channels
      SET is_available = ?
      WHERE channel_code = ?
      `,
            [is_available ? 1 : 0, channel_code]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { message: "Channel not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            channel_code,
            is_available,
        });
    } catch (error) {
        console.error("Failed to update payout channel:", error);
        return NextResponse.json(
            { message: "Failed to update payout channel" },
            { status: 500 }
        );
    }
}
