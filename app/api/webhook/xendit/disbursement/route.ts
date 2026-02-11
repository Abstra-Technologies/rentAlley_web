import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* Terminal settlement rules */
const SUCCESS_STATES = ["SUCCEEDED"];
const FAILURE_STATES = [
    "FAILED",
    "CANCELLED",
    "REVERSED",
    "COMPLIANCE_REJECTED",
];

export async function POST(req: NextRequest) {
    try {
        /* ===============================
           1. Verify webhook token
        ================================ */
        const callbackToken = req.headers.get("x-callback-token");

        if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
            console.error("❌ Invalid Xendit webhook token");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();

        console.log('payload', payload);

        /**
         * Xendit payout webhook payload (important fields)
         * {
         *   id,
         *   external_id,
         *   status,
         *   receipt_url,
         *   failure_reason
         * }
         */
        const {
            id: xenditDisbursementId,
            external_id,
            status,
            receipt_url,
            failure_reason,
        } = payload;

        if (!external_id || !status) {
            return NextResponse.json({ received: true });
        }

        /* ===============================
           2. Load payout history
        ================================ */
        const [rows]: any = await db.query(
            `
            SELECT payout_id, status, included_payments
            FROM LandlordPayoutHistory
            WHERE external_id = ?
            LIMIT 1
            `,
            [external_id]
        );

        if (!rows || rows.length === 0) {
            console.warn("⚠️ No payout history found for:", external_id);
            return NextResponse.json({ received: true });
        }

        const payout = rows[0];

        /* ===============================
           3. Idempotency guard
           (Ignore duplicate terminal events)
        ================================ */
        if (
            SUCCESS_STATES.includes(payout.status) ||
            FAILURE_STATES.includes(payout.status)
        ) {
            console.log("ℹ️ Payout already finalized:", external_id);
            return NextResponse.json({ received: true });
        }

        const paymentIds: number[] = JSON.parse(
            payout.included_payments || "[]"
        );

        /* ===============================
           4. Update payout history
           (Xendit status = truth)
        ================================ */
        await db.query(
            `
            UPDATE LandlordPayoutHistory
            SET
                status = ?,
                receipt_url = ?,
                notes = ?,
                xendit_disbursement_id = ?
            WHERE external_id = ?
            `,
            [
                status,
                receipt_url || null,
                failure_reason || null,
                xenditDisbursementId,
                external_id,
            ]
        );

        /* ===============================
           5. Settle payment payout_status
        ================================ */
        if (paymentIds.length > 0) {
            if (SUCCESS_STATES.includes(status)) {
                await db.query(
                    `
                    UPDATE Payment
                    SET payout_status = 'paid'
                    WHERE payment_id IN (?)
                    `,
                    [paymentIds]
                );
            }

            if (FAILURE_STATES.includes(status)) {
                await db.query(
                    `
                    UPDATE Payment
                    SET payout_status = 'unpaid'
                    WHERE payment_id IN (?)
                    `,
                    [paymentIds]
                );
            }
        }

        /* ===============================
           6. Always ACK webhook
        ================================ */
        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("❌ Xendit webhook error:", err);
        // Xendit retries on non-200 → always return 200
        return NextResponse.json({ received: true });
    }
}
