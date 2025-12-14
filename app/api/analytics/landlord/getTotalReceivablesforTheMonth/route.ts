import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    /* --------------------------------------------------
       REDIS CACHE KEY (per landlord)
    -------------------------------------------------- */
    const cacheKey = `receivables:summary:${landlord_id}`;

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

            return NextResponse.json(parsed, { status: 200 });
        }

        /* --------------------------------------------------
           DATABASE QUERY
        -------------------------------------------------- */
        const [rows]: any = await db.query(
            `
            SELECT 
                SUM(CASE 
                    WHEN b.status = 'paid'
                    THEN b.total_amount_due
                    ELSE 0
                END) AS total_collected,

                SUM(CASE 
                    WHEN b.status = 'unpaid'
                     AND b.due_date >= CURDATE()
                    THEN b.total_amount_due
                    ELSE 0
                END) AS total_pending,

                SUM(CASE 
                    WHEN b.status = 'unpaid'
                     AND b.due_date < CURDATE()
                    THEN b.total_amount_due
                    ELSE 0
                END) AS total_overdue

            FROM Billing b
            JOIN Unit u ON b.unit_id = u.unit_id
            JOIN Property pr ON u.property_id = pr.property_id
            WHERE pr.landlord_id = ?
            `,
            [landlord_id]
        );

        const result = rows?.[0] || {
            total_collected: 0,
            total_pending: 0,
            total_overdue: 0,
        };

        /* --------------------------------------------------
           CACHE RESULT (short TTL)
        -------------------------------------------------- */
        await redis.set(
            cacheKey,
            JSON.stringify(result),
            { ex: 60 } // ⏱ 1 minute
        );

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error fetching receivables:", error);

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
