import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }) {
  const report_id = params.report_id;

  try {
    const [rows] = await db.query(
      "SELECT * FROM BugReport WHERE report_id = ?",
      [report_id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Bug report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
}
