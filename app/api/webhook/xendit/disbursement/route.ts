import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

        /**
         * Expected Xendit payload (important fields)
         * {
         *   id,
         *   external_id,
         *   status, // COMPLETED | FAILED
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
            return NextResponse.json({ ok: true });
        }

        /* ===============================
           2. Find payout record
        ================================ */
        const [rows]: any = await db.query(
            `
      SELECT payout_id, included_payments
      FROM LandlordPayoutHistory
      WHERE external_id = ?
      LIMIT 1
      `,
            [external_id]
        );

        if (!rows || rows.length === 0) {
            console.warn("⚠️ Payout record not found for external_id:", external_id);
            return NextResponse.json({ ok: true });
        }

        const payout = rows[0];
        const paymentIds: number[] = JSON.parse(payout.included_payments || "[]");

        /* ===============================
           3. Handle SUCCESS
        ================================ */
        if (status === "COMPLETED") {
            await db.query(
                `
        UPDATE LandlordPayoutHistory
        SET
          status = 'completed',
          receipt_url = ?,
          xendit_disbursement_id = ?
        WHERE external_id = ?
        `,
                [receipt_url || null, xenditDisbursementId, external_id]
            );

            if (paymentIds.length > 0) {
                await db.query(
                    `
          UPDATE Payment
          SET payout_status = 'paid'
          WHERE payment_id IN (?)
          `,
                    [paymentIds]
                );
            }
        }

        /* ===============================
           4. Handle FAILURE
        ================================ */
        if (status === "FAILED") {
            await db.query(
                `
        UPDATE LandlordPayoutHistory
        SET
          status = 'failed',
          notes = ?,
          xendit_disbursement_id = ?
        WHERE external_id = ?
        `,
                [failure_reason || "Disbursement failed", xenditDisbursementId, external_id]
            );

            if (paymentIds.length > 0) {
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
           5. Always acknowledge webhook
        ================================ */
        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("❌ Xendit webhook error:", err);
        // Xendit retries on non-200, so still return 200
        return NextResponse.json({ received: true });
    }
}
