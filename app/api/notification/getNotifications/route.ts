import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

/* ---------------- CACHED QUERY ---------------- */

const getNotificationsCached = unstable_cache(
    async (userId: string, limit: number) => {
        // @ts-ignore
        const [rows] = await db.query(
            `
      SELECT id, title, body, is_read, created_at, url
      FROM Notification
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `,
            [userId, limit]
        );

        return rows;
    },
    ["notifications-by-user"], // base cache key
    {
        revalidate: 30, // ⏱️ seconds (tune as needed)
        tags: ["notifications"], // for manual invalidation
    }
);

/* ---------------- GET ---------------- */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const limit = Number(searchParams.get("limit") ?? 20);

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const notifications = await getNotificationsCached(userId, limit);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { error: "Database error" },
            { status: 500 }
        );
    }
}



export async function PATCH(req: Request) {
    try {
        const { ids } = await req.json(); // array of IDs

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "Notification IDs are required" },
                { status: 400 }
            );
        }

        await db.query(
            `
      UPDATE Notification
      SET is_read = 1
      WHERE id IN (?)
      `,
            [ids]
        );

        // 🔥 invalidate notifications cache
        revalidateTag("notifications");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json(
            { error: "Database error" },
            { status: 500 }
        );
    }
}
