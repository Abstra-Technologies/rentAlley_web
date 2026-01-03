import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBetaDecisionEmail } from "@/lib/email/sendBetaDecisionEmail";
import {safeDecrypt} from "@/utils/decrypt/safeDecrypt";

/**
 * @route PATCH /api/systemadmin/beta-program/reject
 * @desc  Reject beta applicant with reason (Admin only)
 */
export async function PATCH(req: NextRequest) {
    const { beta_id, admin_id, rejection_reason } = await req.json();

    if (!beta_id || !admin_id || !rejection_reason) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        /* =====================================
           1. Reject Beta Applicant
        ===================================== */
        const [result]: any = await connection.query(
            `
            UPDATE BetaUsers
            SET
                status = 'rejected',
                approved_by = ?,
                approved_at = NULL,
                rejection_reason = ?
            WHERE beta_id = ?
              AND status = 'pending'
            `,
            [admin_id, rejection_reason, beta_id]
        );

        if (result.affectedRows === 0) {
            throw new Error(
                "Beta user not found, already approved, or already rejected"
            );
        }

        /* =====================================
           2. Fetch landlord info for email
        ===================================== */
        const [[landlord]]: any = await connection.query(
            `
            SELECT
                u.email,
                u.firstName
            FROM BetaUsers b
            JOIN Landlord l ON l.landlord_id = b.landlord_id
            JOIN User u ON u.user_id = l.user_id
            WHERE b.beta_id = ?
            `,
            [beta_id]
        );

        await connection.commit();

        /* =====================================
           3. Send Beta Rejection Email (POST-COMMIT)
        ===================================== */
        const decryptedEmail = safeDecrypt(landlord?.email);
        const decryptedFirstName = safeDecrypt(landlord?.firstName);

        if (decryptedEmail) {
            await sendBetaDecisionEmail({
                email: decryptedEmail,
                firstName: decryptedFirstName || undefined,
                decision: "rejected",
                rejectionReason: rejection_reason,
            });
        }

        return NextResponse.json({
            success: true,
            message: "Beta application rejected and applicant notified",
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("[BETA_REJECT_ERROR]", error);

        return NextResponse.json(
            { error: error.message || "Failed to reject beta user" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
