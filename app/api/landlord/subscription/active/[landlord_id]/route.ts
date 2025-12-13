import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { listingLimits } from "@/constant/subscription/limits";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ landlord_id?: string }> }
) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // ✅ REQUIRED IN NEXT 16
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

    try {
        console.log(`[SUBSCRIPTION][${requestId}] QUERY subscription`);

        const queryStart = Date.now();

        const [rows]: any = await db.query({
            sql: `
        SELECT plan_name, start_date, end_date, payment_status, is_trial, is_active
        FROM Subscription
        WHERE landlord_id = ? AND is_active = 1
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

        const currentDate = new Date();
        const endDate = subscription.end_date
            ? new Date(subscription.end_date)
            : null;

        if (endDate && endDate < currentDate && subscription.is_active === 1) {
            console.log(
                `[SUBSCRIPTION][${requestId}] EXPIRED – scheduling deactivate`,
                { endDate }
            );

            // fire-and-forget update (non-blocking)
            db.query({
                sql: "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?",
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

        const limits = listingLimits[subscription.plan_name] || {};
        subscription.listingLimits = limits;

        console.log(
            `[SUBSCRIPTION][${requestId}] SUCCESS`,
            `totalDuration=${Date.now() - startTime}ms`
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
