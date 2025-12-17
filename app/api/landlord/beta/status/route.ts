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

        // Get landlord_id
        const [landlordRows]: any = await db.query(
            `SELECT landlord_id FROM Landlord WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (!landlordRows.length) {
            return NextResponse.json({ status: "none" });
        }

        const landlord_id = landlordRows[0].landlord_id;

        // Check subscription (approved beta)
        const [subscription]: any = await db.query(
            `
      SELECT plan_name
      FROM Subscription
      WHERE landlord_id = ?
        AND plan_name = 'BETA_FULL_ACCESS'
        AND is_active = 1
      LIMIT 1
      `,
            [landlord_id]
        );

        if (subscription.length) {
            return NextResponse.json({ status: "approved" });
        }

        // Check beta application
        const [beta]: any = await db.query(
            `
      SELECT status
      FROM BetaUsers
      WHERE landlord_id = ?
      LIMIT 1
      `,
            [landlord_id]
        );

        if (!beta.length) {
            return NextResponse.json({ status: "none" });
        }

        return NextResponse.json({ status: beta[0].status });

    } catch (err) {
        console.error("[BETA_STATUS_ERROR]", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
