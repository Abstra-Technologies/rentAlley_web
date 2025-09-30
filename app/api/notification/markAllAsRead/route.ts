import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    // const idList = ids.map((id) => db.escape(id)).join(",");

    const query = `UPDATE Notification SET is_read = 1 WHERE id IN (?)`;
    await db.query(query, [ids]);

    return NextResponse.json(
      { message: "Notifications marked as read" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
