import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route   PUT /api/unitListing/publish
 * @desc    Toggle a unit's published visibility
 * @body    { unit_id: string, publish: boolean }
 * @return  { success: boolean, message?: string }
 */

export async function PUT(req: NextRequest) {
    try {
        const { unit_id, publish } = await req.json();

        // 🔍 Validate input
        if (!unit_id || typeof publish !== "boolean") {
            return NextResponse.json(
                { success: false, message: "Missing or invalid parameters." },
                { status: 400 }
            );
        }

        const [result]: any = await db.execute(
            `UPDATE rentalley_db.Unit 
       SET publish = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE unit_id = ?`,
            [publish ? 1 : 0, unit_id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, message: "Unit not found or update failed." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: publish
                ? "Unit successfully published."
                : "Unit successfully hidden.",
        });
    } catch (error: any) {
        console.error("🔥 Publish toggle failed:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
