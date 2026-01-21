import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        /* =====================================
           1. Parse body SAFELY
        ===================================== */
        let body: any = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const user_id = body.user_id;

        if (!user_id) {
            return NextResponse.json(
                { error: "Missing user_id" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        /* =====================================
           2. Get landlord_id
        ===================================== */
        const [landlordRows]: any = await connection.query(
            `SELECT landlord_id FROM Landlord WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (!landlordRows.length) {
            throw new Error("Landlord not found");
        }

        const landlord_id = landlordRows[0].landlord_id;

        /* =====================================
           3. Validate beta approval
        ===================================== */
        const [betaRows]: any = await connection.query(
            `
      SELECT status, is_activated
      FROM BetaUsers
      WHERE landlord_id = ?
      LIMIT 1
      `,
            [landlord_id]
        );

        if (!betaRows.length) {
            throw new Error("No beta application found");
        }

        const beta = betaRows[0];

        if (beta.status !== "approved") {
            throw new Error("Beta application is not approved");
        }

        if (beta.is_activated === 1) {
            throw new Error("Beta already activated");
        }

        /* =====================================
           4. Activate beta
        ===================================== */
        await connection.query(
            `
      UPDATE BetaUsers
      SET is_activated = 1
      WHERE landlord_id = ?
      `,
            [landlord_id]
        );

        /* =====================================
           5. Create beta subscription
           (start = activation date)
        ===================================== */
        await connection.query(
            `
      INSERT INTO Subscription (
        landlord_id,
        plan_name,
        start_date,
        end_date,
        payment_status,
        request_reference_number,
        is_trial,
        amount_paid,
        is_active
      ) VALUES (
        ?,
        'Beta_Program',
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL 60 DAY),
        'paid',
        CONCAT('BETA-', UUID()),
        1,
        0.00,
        1
      )
      `,
            [landlord_id]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Beta activated successfully. Your 60-day access starts today.",
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("[BETA_ACTIVATE_ERROR]", error);

        return NextResponse.json(
            { error: error.message || "Failed to activate beta" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
