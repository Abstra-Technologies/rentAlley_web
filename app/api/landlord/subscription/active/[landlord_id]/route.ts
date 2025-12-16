
//  API to get Suvscritipon limit on plans.

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { listingLimits } from "@/constant/subscription/limits";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ landlord_id?: string }> }
) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    const { landlord_id } = await params;

    console.log(
        `[SUBSCRIPTION][${requestId}] START`,
        { landlord_id, url: req.url }
    );

    if (!landlord_id || landlord_id === "undefined") {
        console.warn(
            `[SUBSCRIPTION][${requestId}] INVALID landlord_id`,
            landlord_id
        );

        return NextResponse.json(
            { error: "Invalid landlord_id" },
            { status: 400 }
        );
    }

    /* --------------------------------------------------
       REDIS CACHE KEY (per landlord)
    -------------------------------------------------- */
    const cacheKey = `subscription:active:${landlord_id}`;

    try {
        /* --------------------------------------------------
           CHECK CACHE FIRST
        -------------------------------------------------- */
        const cached = await redis.get(cacheKey);
        if (cached) {
            let parsed;
            try {
                parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
            } catch (err) {
                console.error(
                    `[SUBSCRIPTION][${requestId}] CACHE PARSE ERROR`,
                    err
                );
                parsed = cached;
            }

            console.log(
                `[SUBSCRIPTION][${requestId}] CACHE HIT`,
                `duration=${Date.now() - startTime}ms`
            );

            return NextResponse.json(parsed);
        }

        /* --------------------------------------------------
           DATABASE QUERY
        -------------------------------------------------- */
        console.log(`[SUBSCRIPTION][${requestId}] QUERY subscription`);
        const queryStart = Date.now();

        const [rows]: any = await db.query({
            sql: `
                SELECT
                    plan_name,
                    start_date,
                    end_date,
                    payment_status,
                    is_trial,
                    is_active
                FROM Subscription
                WHERE landlord_id = ?
                  AND is_active = 1
                LIMIT 1
            `,
            values: [landlord_id],
            timeout: 5000,
        });

        console.log(
            `[SUBSCRIPTION][${requestId}] QUERY DONE`,
            `rows=${rows?.length ?? 0}`,
            `duration=${Date.now() - queryStart}ms`
        );

        if (!rows || rows.length === 0) {
            console.warn(
                `[SUBSCRIPTION][${requestId}] NO ACTIVE SUBSCRIPTION`
            );

            return NextResponse.json(
                { error: "Subscription not found" },
                { status: 404 }
            );
        }

        const subscription = rows[0];

        /* --------------------------------------------------
           EXPIRATION CHECK (authoritative DB logic)
        -------------------------------------------------- */
        const currentDate = new Date();
        const endDate = subscription.end_date
            ? new Date(subscription.end_date)
            : null;

        if (endDate && endDate < currentDate && subscription.is_active === 1) {
            console.log(
                `[SUBSCRIPTION][${requestId}] EXPIRED – scheduling deactivate`,
                { endDate }
            );

            // Fire-and-forget deactivate
            db.query({
                sql: `
                    UPDATE Subscription
                    SET is_active = 0
                    WHERE landlord_id = ?
                `,
                values: [landlord_id],
                timeout: 3000,
            }).catch((err) => {
                console.error(
                    `[SUBSCRIPTION][${requestId}] DEACTIVATE FAILED`,
                    err
                );
            });

            subscription.is_active = 0;
        }

        /* --------------------------------------------------
           ATTACH LIMITS
        -------------------------------------------------- */
        subscription.listingLimits =
            listingLimits[subscription.plan_name] || {};

        /* --------------------------------------------------
           CACHE RESULT (short TTL = safe)
        -------------------------------------------------- */
        await redis.set(
            cacheKey,
            JSON.stringify(subscription),
            { ex: 60 } // ⏱ 1 minute (billing-safe)
        );

        return NextResponse.json(subscription);
    } catch (error) {
        console.error(
            `[SUBSCRIPTION][${requestId}] FATAL ERROR`,
            error
        );

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
