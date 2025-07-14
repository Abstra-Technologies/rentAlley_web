import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");

  if (!user_id) {
    return NextResponse.json({ message: "Missing user_id" }, { status: 400 });
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  });

  try {
    const [rows]: any = await db.execute(
      `SELECT landlord_id, is_verified FROM Landlord WHERE user_id = ?`,
      [user_id]
    );

    if (rows.length === 0) {
      await db.end();
      return NextResponse.json({ message: "Landlord not found" }, { status: 404 });
    }

    const { is_verified } = rows[0];
    const verificationStatus = is_verified === 1 ? "verified" : "not verified";

    await db.end();
    return NextResponse.json({ verification_status: verificationStatus }, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    await db.end();
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
