import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // your existing MySQL connection

export async function POST(req: NextRequest) {
    try {
        const { userId, token } = await req.json();
        if (!userId || !token) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const sql = `
            UPDATE User
            SET fcm_token = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;

        const [result]: any = await db.execute(sql, [token, userId]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error saving FCM token:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
