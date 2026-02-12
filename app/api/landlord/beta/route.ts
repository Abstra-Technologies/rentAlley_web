import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        /* ===============================
           1️⃣ Parse body safely
        ================================ */
        let body: any = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: "Missing user_id" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        /* ===============================
           2️⃣ Resolve landlord_id
        ================================ */
        const [landlordRows]: any = await connection.query(
            `SELECT landlord_id 
             FROM rentalley_db.Landlord 
             WHERE user_id = ? 
             LIMIT 1`,
            [user_id]
        );

        if (!landlordRows.length) {
            throw new Error("Landlord not found");
        }

        const landlord_id = landlordRows[0].landlord_id;

        /* ===============================
           3️⃣ CHECK IF ANY SUBSCRIPTION EXISTS
           (ACTIVE OR TRIAL OR PAID)
        ================================ */

        const [existingSubs]: any = await connection.query(
            `
            SELECT subscription_id 
            FROM rentalley_db.Subscription
            WHERE landlord_id = ?
            LIMIT 1
            `,
            [landlord_id]
        );

        if (existingSubs.length > 0) {
            throw new Error(
                "You already have a subscription. Beta is only available for new landlords."
            );
        }

        /* ===============================
           4️⃣ CREATE BETA SUBSCRIPTION
        ================================ */

        await connection.query(
            `
            INSERT INTO rentalley_db.Subscription (
                landlord_id,
                plan_name,
                plan_code,
                start_date,
                end_date,
                payment_status,
                request_reference_number,
                is_trial,
                amount_paid,
                is_active
            ) VALUES (
                ?,
                'Beta Program',
                'BETA',
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

        return NextResponse.json(
            {
                success: true,
                message:
                    "Beta activated successfully. Your 60-day access starts today.",
            },
            { status: 201 }
        );
    } catch (error: any) {
        await connection.rollback();
        console.error("[BETA_AUTO_ACTIVATE_ERROR]", error);

        return NextResponse.json(
            {
                error:
                    error.message ||
                    "Failed to activate beta program",
            },
            { status: 400 }
        );
    } finally {
        connection.release();
    }
}
