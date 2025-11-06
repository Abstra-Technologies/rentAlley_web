
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get("unit_id");

    if (!unitId) {
        return NextResponse.json({ error: "unit_id is required" }, { status: 400 });
    }

    try {
        const [invitation] = await db.query(
            `SELECT email, expiresAt FROM InviteCode WHERE unitId = ? AND status = 'PENDING' LIMIT 1`,
            [unitId]
        );

        if (invitation) {
            return NextResponse.json({
                email: invitation.email,
                expiresAt: invitation.expiresAt,
            });
        }
        return NextResponse.json({});
    } catch (error) {
        console.error("Error checking invitation:", error);
        return NextResponse.json({ error: "Failed to check invitation" }, { status: 500 });
    }
}