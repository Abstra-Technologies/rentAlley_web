import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route PATCH /api/systemadmin/beta-program/approve
 * @desc  Approve beta applicant + create 60-day BETA subscription
 */
export async function PATCH(req: NextRequest) {
    const { beta_id, landlord_id, admin_id } = await req.json();

    console.log('BETA ID: ', beta_id);
    console.log('LANDLORD: ', landlord_id);
    console.log('admin_id: ', admin_id);

    if (!beta_id || !landlord_id || !admin_id) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        /* =====================================
           1. Approve Beta User
           - approved_at = NOW()
        ===================================== */
        const [betaResult]: any = await connection.query(
            `
            UPDATE BetaUsers
            SET
                status = 'approved',
                approved_by = ?,
                approved_at = NOW(),
                rejection_reason = NULL
            WHERE beta_id = ?
              AND status = 'pending'
            `,
            [admin_id, beta_id]
        );

        if (betaResult.affectedRows === 0) {
            throw new Error("Beta user not found or already processed");
        }

        /* =====================================
           2. Prevent duplicate active subscription
        ===================================== */
        const [existing]: any = await connection.query(
            `
            SELECT subscription_id
            FROM Subscription
            WHERE landlord_id = ?
              AND is_active = 1
            LIMIT 1
            `,
            [landlord_id]
        );

        if (existing.length > 0) {
            throw new Error("Landlord already has an active subscription");
        }

        /* =====================================
           3. Insert BETA Subscription
           - start_date = DATE(approved_at)
           - end_date   = approved_at + 60 days
        ===================================== */
        await connection.query(
            `
            INSERT INTO Subscription (
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
            )
            SELECT
                b.landlord_id,
                'Beta_Program',
                'BETA',
                DATE(b.approved_at),
                DATE_ADD(b.approved_at, INTERVAL 60 DAY),
                'paid',
                CONCAT('BETA-', UUID()),
                1,
                0.00,
                1
            FROM BetaUsers b
            WHERE b.beta_id = ?
            `,
            [beta_id]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Beta approved and 60-day BETA subscription activated",
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("[BETA_APPROVE_ERROR]", error);

        return NextResponse.json(
            { error: error.message || "Failed to approve beta user" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
