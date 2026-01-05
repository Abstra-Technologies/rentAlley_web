import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    const [rows]: any = await db.query(
        `SELECT house_policy FROM Property WHERE property_id = ?`,
        [property_id]
    );

    return NextResponse.json({ policy: rows?.[0]?.house_policy || "" });
}

export async function POST(req: NextRequest) {
    const { property_id, policy } = await req.json();

    await db.query(
        `UPDATE Property SET house_policy = ? WHERE property_id = ?`,
        [policy, property_id]
    );

    return NextResponse.json({ success: true });
}
