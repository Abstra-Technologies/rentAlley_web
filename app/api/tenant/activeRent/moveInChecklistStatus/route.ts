// /app/api/tenant/moveinChecklist/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json({ message: "agreement_id is required" }, { status: 400 });
    }

    try {
        const [rows] = await db.query(
            "SELECT status FROM MoveInChecklist WHERE agreement_id = ?",
            [agreement_id]
        );

        // Show button if no checklist exists or status is not completed
        if (!rows || (Array.isArray(rows) && rows.length === 0)) {
            return NextResponse.json({ showButton: true }, { status: 200 });
        }

        const checklist = Array.isArray(rows) ? rows[0] : rows;
        // @ts-ignore

        return NextResponse.json({ showButton: checklist.status !== "completed",  status: checklist.status }, { status: 200 });

    } catch (error) {
        console.error("Error fetching move-in checklist status:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
