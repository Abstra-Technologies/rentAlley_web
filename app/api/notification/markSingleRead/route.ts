
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ids } = body;

        if ((!id && !ids) || (ids && !Array.isArray(ids))) {
            return NextResponse.json(
                { message: "Invalid request. Provide either 'id' or 'ids'." },
                { status: 400 }
            );
        }

        if (id) {
            // Single notification
            await db.query(`UPDATE Notification SET is_read = 1 WHERE id = ?`, [id]);
            return NextResponse.json(
                { message: `Notification ${id} marked as read` },
                { status: 200 }
            );
        }

        if (ids && ids.length > 0) {
            // Multiple notifications
            const idList = ids.map((id: number) => db.escape(id)).join(",");
            const query = `UPDATE Notification SET is_read = 1 WHERE id IN (${idList})`;
            await db.query(query);

            return NextResponse.json(
                { message: "Notifications marked as read" },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { message: "No valid notification ID(s) provided" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error updating notifications:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
