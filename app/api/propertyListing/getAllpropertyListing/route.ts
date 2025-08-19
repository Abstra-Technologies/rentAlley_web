import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");

        if (!landlordId) {
            return NextResponse.json(
                { error: "landlord_id is required" },
                { status: 400 }
            );
        }

        // Fetch properties with raw SQL (MySQL/Postgres style)
        const [properties] = await db.query(
            "SELECT * FROM Property WHERE landlord_id = ?",
            [landlordId]
        );

        return NextResponse.json(properties);
    } catch (error) {
        console.error("Error fetching properties:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
