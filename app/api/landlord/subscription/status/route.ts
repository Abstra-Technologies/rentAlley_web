import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get("user_id");

        if (!user_id) {
            return NextResponse.json(
                { error: "Missing user_id" },
                { status: 400 }
            );
        }

        /* ===============================
           1️⃣ Resolve landlord_id
        ================================ */
        const [landlordRows]: any = await db.query(
            `
            SELECT landlord_id
            FROM rentalley_db.Landlord
            WHERE user_id = ?
            LIMIT 1
            `,
            [user_id]
        );

        if (!landlordRows.length) {
            return NextResponse.json(
                { has_subscription: false },
                { status: 200 }
            );
        }

        const landlord_id = landlordRows[0].landlord_id;

        /* ===============================
           2️⃣ Get active subscription
        ================================ */
        const [subRows]: any = await db.query(
            `
            SELECT 
                subscription_id,
                plan_name,
                plan_code,
                start_date,
                end_date,
                is_active,
                payment_status
            FROM rentalley_db.Subscription
            WHERE landlord_id = ?
              AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [landlord_id]
        );

        if (!subRows.length) {
            return NextResponse.json(
                {
                    has_subscription: false,
                },
                { status: 200 }
            );
        }

        const sub = subRows[0];

        return NextResponse.json(
            {
                has_subscription: true,
                subscription_id: sub.subscription_id,
                plan_name: sub.plan_name,
                plan_code: sub.plan_code,
                start_date: sub.start_date,
                end_date: sub.end_date,
                is_active: sub.is_active === 1,
                payment_status: sub.payment_status,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[SUBSCRIPTION_STATUS_ERROR]", error);

        return NextResponse.json(
            { error: "Failed to fetch subscription status" },
            { status: 500 }
        );
    }
}
