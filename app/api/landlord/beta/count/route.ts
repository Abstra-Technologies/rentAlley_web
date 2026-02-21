import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    const connection = await db.getConnection();

    try {
        const [rows]: any = await connection.query(
            `
            SELECT COUNT(*) as total
            FROM rentalley_db.BetaUsers
       
            `
        );

        return NextResponse.json(
            {
                success: true,
                count: rows[0].total,
                max: 20,
                remaining: 20 - rows[0].total,
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("[BETA_COUNT_ERROR]", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch beta count",
            },
            { status: 500 }
        );

    } finally {
        connection.release();
    }
}
