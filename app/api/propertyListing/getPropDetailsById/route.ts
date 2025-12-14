import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    if (!property_id) {
        return NextResponse.json(
            { error: "Property ID is required" },
            { status: 400 }
        );
    }

    /* --------------------------------------------------
       REDIS CACHE KEY (per property)
    -------------------------------------------------- */
    const cacheKey = `property:details:${property_id}`;

    try {
        /* --------------------------------------------------
           CACHE HIT
        -------------------------------------------------- */
        const cached = await redis.get(cacheKey);
        if (cached) {
            let parsed;
            try {
                parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
            } catch {
                parsed = cached;
            }

            return NextResponse.json(parsed);
        }

        /* --------------------------------------------------
           DATABASE QUERY
        -------------------------------------------------- */
        const [result]: any = await db.query(
            `
            SELECT 
                property_id,
                property_name,
                property_type,
                description,
                street,
                brgy_district,
                city,
                province,
                zip_code,
                floor_area,
                amenities,
                water_billing_type,
                electricity_billing_type,
                assoc_dues,
                late_fee
            FROM Property
            WHERE property_id = ?
            `,
            [property_id]
        );

        if (!result || result.length === 0) {
            return NextResponse.json(
                { error: "Property not found" },
                { status: 404 }
            );
        }

        const property = result[0];

        const responsePayload = {
            property: {
                ...property,
                amenities: property.amenities
                    ? property.amenities
                        .split(",")
                        .map((a: string) => a.trim())
                    : [],
            },
        };

        /* --------------------------------------------------
           CACHE RESULT
        -------------------------------------------------- */
        await redis.set(
            cacheKey,
            JSON.stringify(responsePayload),
            { ex: 300 } // ⏱ 5 minutes
        );

        return NextResponse.json(responsePayload);
    } catch (error) {
        console.error("Error fetching property:", error);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
