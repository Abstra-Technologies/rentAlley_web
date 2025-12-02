import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================
// GET — fetch move_in_date
// ============================
export async function GET(req: NextRequest) {
    const agreement_id = req.nextUrl.searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { error: "Missing agreement_id" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
            SELECT move_in_date
            FROM LeaseAgreement
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        return NextResponse.json(
            {
                success: true,
                move_in_date: rows?.[0]?.move_in_date || null,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error fetching move-in date:", err);
        return NextResponse.json(
            { error: "Failed to fetch move-in date" },
            { status: 500 }
        );
    }
}

// ============================
// POST — update move_in_date
// ============================
export async function POST(req: NextRequest) {
    try {
        const { agreement_id, move_in_date } = await req.json();

        if (!agreement_id || !move_in_date) {
            return NextResponse.json(
                { error: "Missing agreement_id or move_in_date" },
                { status: 400 }
            );
        }

        await db.query(
            `
            UPDATE LeaseAgreement
            SET move_in_date = ?
            WHERE agreement_id = ?
            `,
            [move_in_date, agreement_id]
        );

        return NextResponse.json(
            { success: true, message: "Move-in date updated successfully." },
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error updating move-in date:", err);
        return NextResponse.json(
            { error: "Failed to update move-in date" },
            { status: 500 }
        );
    }
}
