import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, token, platform } = body;

        if (!userId || !token || !platform) {
            return NextResponse.json(
                { message: "Missing required fields (userId, token, platform)" },
                { status: 400 }
            );
        }

        // Check if user exists
        const [userRows]: any = await db.execute(
            `SELECT user_id FROM rentalley_db.User WHERE user_id = ?`,
            [userId]
        );

        if (!userRows.length) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // DELETE duplicate tokens (e.g., reinstall app)
        await db.execute(
            `DELETE FROM rentalley_db.FCM_Token WHERE token = ?`,
            [token]
        );

        await db.execute(
            `
            INSERT INTO rentalley_db.FCM_Token (id, user_id, token, platform, active, createdAt)
            VALUES (?, ?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE active = 1, updatedAt = NOW();
            `,
            [uuidv4(), userId, token, platform]
        );

        return NextResponse.json(
            { message: "Token saved successfully", token, platform },
            { status: 201 }
        );

    } catch (err: any) {
        console.error("❌ Error saving token:", err);
        return NextResponse.json(
            {
                message: "Internal Server Error",
                error: err.message,
            },
            { status: 500 }
        );
    }
}
