import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");
    const role = searchParams.get("role");

    if (!agreement_id || !role) {
        return NextResponse.json({ error: "Missing parameters." }, { status: 400 });
    }

    try {
        const [rows]: any = await db.query(
            `SELECT status FROM LeaseSignature WHERE agreement_id = ? AND role = ? LIMIT 1`,
            [agreement_id, role]
        );

        const signed = rows?.[0]?.status === "signed";
        return NextResponse.json({ signed }, { status: 200 });
    } catch (error: any) {
        console.error("Error checking signature:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
