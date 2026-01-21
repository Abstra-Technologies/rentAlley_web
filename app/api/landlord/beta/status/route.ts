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
           1. Get landlord_id
        =============================== */
        const [landlordRows]: any = await db.query(
            `SELECT landlord_id FROM Landlord WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (!landlordRows.length) {
            return NextResponse.json({
                status: "none",
                is_activated: false,
                is_active: false,
            });
        }

        const landlord_id = landlordRows[0].landlord_id;

        /* ===============================
           2. Get beta application status
           + activation flag
        =============================== */
        const [betaRows]: any = await db.query(
            `
      SELECT status, is_activated
      FROM BetaUsers
      WHERE landlord_id = ?
      LIMIT 1
      `,
            [landlord_id]
        );

        if (!betaRows.length) {
            return NextResponse.json({
                status: "none",
                is_activated: false,
                is_active: false,
            });
        }

        const betaStatus = betaRows[0].status;           // pending | approved | rejected
        const isActivated = !!betaRows[0].is_activated; // boolean

        /* ===============================
           3. Check active beta subscription
           (true only after activation)
        =============================== */
        const [subscriptionRows]: any = await db.query(
            `
      SELECT subscription_id
      FROM Subscription
      WHERE landlord_id = ?
        AND plan_name = 'Beta_Program'
        AND is_active = 1
      LIMIT 1
      `,
            [landlord_id]
        );

        const isActive = subscriptionRows.length > 0;

        return NextResponse.json({
            status: betaStatus,
            is_activated: isActivated,
            is_active: isActive,
        });

    } catch (err) {
        console.error("[BETA_STATUS_ERROR]", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
