import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }) {
    const { asset_id } = params;

    if (!asset_id)
        return NextResponse.json({ message: "Missing asset ID" }, { status: 400 });

    try {
        const [rows] = await db.execute(
            `
        SELECT *
        FROM rentalley_db.Asset
        WHERE asset_id = ?
      `,
            [asset_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { message: "Asset not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ asset: rows[0] });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
