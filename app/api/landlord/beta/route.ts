import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            user_id,
            fullName,
            email,
            propertiesCount,
            avgUnitsPerProperty,
            region,
            province,
            city,
        } = body;

        /* =============================
           Basic validation
        ============================== */
        if (
            !user_id ||
            !fullName ||
            !email ||
            !propertiesCount ||
            !avgUnitsPerProperty ||
            !region ||
            !province ||
            !city
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        /* =============================
           Resolve landlord_id
        ============================== */
        const [landlordRows]: any = await db.query(
            `SELECT landlord_id FROM Landlord WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (!landlordRows.length) {
            return NextResponse.json(
                { error: "Landlord not found" },
                { status: 404 }
            );
        }

        const landlord_id = landlordRows[0].landlord_id;

        /* =============================
           Prevent duplicate application
        ============================== */
        const [existing]: any = await db.query(
            `SELECT beta_id, status FROM BetaUsers WHERE landlord_id = ? LIMIT 1`,
            [landlord_id]
        );

        if (existing.length) {
            return NextResponse.json(
                {
                    error: "Beta application already exists",
                    status: existing[0].status,
                },
                { status: 409 }
            );
        }

        /* =============================
           Insert Beta User
        ============================== */
        await db.query(
            `
      INSERT INTO BetaUsers (
        landlord_id,
        full_name,
        email,
        properties_count,
        avg_units_per_property,
        region,
        province,
        city,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
            [
                landlord_id,
                fullName,
                email,
                propertiesCount,
                avgUnitsPerProperty,
                region,
                province,
                city,
            ]
        );

        return NextResponse.json(
            { message: "Beta application submitted successfully" },
            { status: 201 }
        );

    } catch (error) {
        console.error("[BETA_JOIN_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
