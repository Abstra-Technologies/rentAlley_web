import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper to extract asset_id from S3 QR URL
function extractAssetId(asset_id: string) {
    try {
        if (!asset_id.includes("amazonaws.com") && !asset_id.includes("-QR-")) {
            return asset_id;
        }

        // Extract filename from the URL
        const file = asset_id.split("/").pop(); // "12345-QR-UPKYDYDDUS08.png"
        if (!file) return asset_id;

        const withoutExt = file.replace(".png", "");
        const parts = withoutExt.split("-QR-");

        return parts[1] || asset_id;
    } catch {
        return asset_id;
    }
}

export async function GET(req: NextRequest, { params }) {
    let { asset_id } = params;

    if (!asset_id)
        return NextResponse.json({ message: "Missing asset ID" }, { status: 400 });

    // 🔥 Normalize: extract ID even if input is a full S3 URL
    const cleanAssetId = extractAssetId(asset_id);

    try {
        const [rows] = await db.execute(
            `
                SELECT *
                FROM rentalley_db.Asset
                WHERE asset_id = ?
            `,
            [cleanAssetId]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { message: "Asset not found", asset_id: cleanAssetId },
                { status: 404 }
            );
        }

        return NextResponse.json({ asset: rows[0] });
    } catch (error) {
        console.error("Asset Lookup Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
