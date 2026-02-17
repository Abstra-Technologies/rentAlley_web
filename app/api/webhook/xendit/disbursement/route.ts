import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const SUCCESS_STATES = ["SUCCEEDED"];
const FAILURE_STATES = [
    "FAILED",
    "CANCELLED",
    "REVERSED",
    "COMPLIANCE_REJECTED",
];

export async function POST(req: NextRequest) {
    console.log("🚀 WEBHOOK HIT");

    try {
        /* ===============================
           1. Verify webhook token
        ================================ */
        const callbackToken = req.headers.get("x-callback-token");
        console.log("🔐 CALLBACK TOKEN:", callbackToken);

        if (callbackToken !== process.env.XENDIT_TEXT_WEBHOOK_TOKEN) {
            console.error("❌ INVALID TOKEN");s
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        /* ===============================
           2. Read payload
        ================================ */
        const payload = await req.json();
        console.log("📦 RAW PAYLOAD:", JSON.stringify(payload, null, 2));

        /* ===============================
           3. Extract Xendit v2 fields
        ================================ */
        const data = payload?.data;

        console.log("📂 PAYLOAD.DATA:", JSON.stringify(data, null, 2));

        if (!data) {
            console.error("❌ payload.data is missing");
            return NextResponse.json({ received: true });
        }

        const external_id = data.reference_id;
        const status = data.status;
        const xenditDisbursementId = data.id;
        const receipt_url = data.receipt_url || null;
        const failure_reason = data.failure_reason || null;

        console.log("🧩 PARSED FIELDS:", {
            external_id,
            status,
            xenditDisbursementId,
            receipt_url,
            failure_reason,
        });

        if (!external_id || !status) {
            console.error("❌ Missing external_id or status");
            return NextResponse.json({ received: true });
        }

        /* ===============================
           4. Load payout history
        ================================ */
        console.log("🔎 QUERY payout history WHERE external_id =", external_id);

        const [rows]: any = await db.query(
            `
            SELECT payout_id, status, included_payments
            FROM LandlordPayoutHistory
            WHERE external_id = ?
            LIMIT 1
            `,
            [external_id]
        );

        console.log("📊 DB RESULT:", rows);

        if (!rows || rows.length === 0) {
            console.error("❌ NO PAYOUT FOUND FOR external_id:", external_id);
            return NextResponse.json({ received: true });
        }

        const payout = rows[0];
        console.log("📄 PAYOUT RECORD:", payout);

        /* ===============================
           5. Idempotency guard
        ================================ */
        if (
            SUCCESS_STATES.includes(payout.status) ||
            FAILURE_STATES.includes(payout.status)
        ) {
            console.warn("⏭️ PAYOUT ALREADY FINAL:", payout.status);
            return NextResponse.json({ received: true });
        }

        /* ===============================
           6. Parse included payments
        ================================ */
        let paymentIds: number[] = [];

        try {
            paymentIds = JSON.parse(payout.included_payments || "[]");
        } catch (e) {
            console.error("❌ FAILED TO PARSE included_payments:", payout.included_payments);
            return NextResponse.json({ received: true });
        }

        console.log("💳 PAYMENT IDS:", paymentIds);

        /* ===============================
           7. Update payout history
        ================================ */
        console.log("✏️ UPDATING LandlordPayoutHistory");

        const payoutUpdate = await db.query(
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
                receipt_url,
                failure_reason,
                xenditDisbursementId,
                external_id,
            ]
        );

        console.log("✅ PAYOUT UPDATE RESULT:", payoutUpdate);

        /* ===============================
           8. Update payment payout_status
        ================================ */
        if (paymentIds.length === 0) {
            console.warn("⚠️ No payments linked to payout");
        }

        if (SUCCESS_STATES.includes(status)) {
            console.log("💰 SETTING PAYMENTS TO PAID");

            const paymentUpdate = await db.query(
                `
                UPDATE Payment
                SET payout_status = 'paid'
                WHERE payment_id IN (?)
                `,
                [paymentIds]
            );

            console.log("✅ PAYMENT UPDATE RESULT:", paymentUpdate);
        }

        if (FAILURE_STATES.includes(status)) {
            console.log("↩️ REVERTING PAYMENTS TO UNPAID");

            const paymentUpdate = await db.query(
                `
                UPDATE Payment
                SET payout_status = 'unpaid'
                WHERE payment_id IN (?)
                `,
                [paymentIds]
            );

            console.log("✅ PAYMENT UPDATE RESULT:", paymentUpdate);
        }

        console.log("🎉 WEBHOOK PROCESSING COMPLETE");

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("🔥 WEBHOOK FATAL ERROR:", err);
        return NextResponse.json({ received: true });
    }
}
