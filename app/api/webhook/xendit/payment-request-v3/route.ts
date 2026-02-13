import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_TEXT_WEBHOOK_TOKEN,
} = process.env;

async function getDbConnection() {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

function log(step: string, data?: any) {
    console.log(`\n========== ${step} ==========\n`);
    if (data) console.log(JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
    let conn: mysql.Connection | null = null;

    try {
        /* ------------------------------------------------------------ */
        /* 1️⃣ VERIFY TOKEN                                              */
        /* ------------------------------------------------------------ */

        const callbackToken = req.headers.get("x-callback-token");

        if (callbackToken !== XENDIT_TEXT_WEBHOOK_TOKEN) {
            return NextResponse.json(
                { message: "Invalid webhook token" },
                { status: 401 }
            );
        }

        /* ------------------------------------------------------------ */
        /* 2️⃣ PARSE PAYLOAD                                             */
        /* ------------------------------------------------------------ */

        const payload = await req.json();
        log("XENDIT WEBHOOK RECEIVED", payload);

        const eventType = payload.event;
        const data = payload.data;

        if (!data?.reference_id) {
            return NextResponse.json(
                { message: "Missing reference_id" },
                { status: 400 }
            );
        }

        const {
            payment_id,
            payment_request_id,
            reference_id,
            status,
            channel_code,
            request_amount,
            paid_amount,
            captures,
        } = data;

        if (!reference_id.startsWith("billing-")) {
            return NextResponse.json({ message: "Ignored (not billing)" });
        }

        const billing_id = reference_id.split("-")[1];

        conn = await getDbConnection();
        await conn.beginTransaction();

        /* ------------------------------------------------------------ */
        /* 3️⃣ FETCH BILLING                                             */
        /* ------------------------------------------------------------ */

        const [rows]: any = await conn.execute(
            `SELECT billing_id, lease_id, status
       FROM Billing
       WHERE billing_id = ?
       LIMIT 1`,
            [billing_id]
        );

        if (!rows.length) {
            await conn.rollback();
            return NextResponse.json(
                { message: "Billing not found" },
                { status: 404 }
            );
        }

        const billing = rows[0];

        /* ------------------------------------------------------------ */
        /* 4️⃣ SUCCESS EVENTS (V3 SAFE)                                  */
        /* ------------------------------------------------------------ */

        const isSuccess =
            eventType === "payment.succeeded" ||
            (eventType === "payment.capture" && status === "SUCCEEDED");

        if (isSuccess) {

            log("PROCESSING SUCCESS EVENT");

            // Prevent double processing
            if (billing.status === "paid") {
                await conn.rollback();
                return NextResponse.json({ message: "Already processed" });
            }

            const finalAmount =
                paid_amount ??
                captures?.[0]?.capture_amount ??
                request_amount;

            const gatewayRef = payment_id || payment_request_id;

            /* Extra idempotency check */
            const [existing]: any = await conn.execute(
                `SELECT payment_id FROM Payment
         WHERE gateway_transaction_ref = ?
         LIMIT 1`,
                [gatewayRef]
            );

            if (existing.length) {
                await conn.rollback();
                return NextResponse.json({ message: "Duplicate webhook ignored" });
            }

            /* Update Billing */
            await conn.execute(
                `UPDATE Billing
         SET status = 'paid',
             paid_at = NOW()
         WHERE billing_id = ?`,
                [billing_id]
            );

            /* Insert Payment */
            await conn.execute(
                `
        INSERT INTO Payment (
          bill_id,
          agreement_id,
          payment_type,
          amount_paid,
          payment_method_id,
          payment_status,
          receipt_reference,
          payment_date,
          gross_amount,
          gateway_transaction_ref,
          raw_gateway_payload,
          created_at,
          updated_at
        )
        VALUES (?, ?, 'monthly_billing', ?, ?, 'confirmed', ?, NOW(), ?, ?, ?, NOW(), NOW())
        `,
                [
                    billing_id,
                    billing.lease_id,
                    finalAmount,
                    channel_code,
                    payment_request_id,
                    request_amount,
                    gatewayRef,
                    JSON.stringify(payload),
                ]
            );

            await conn.commit();

            log("PAYMENT CONFIRMED SUCCESSFULLY");

            return NextResponse.json({
                message: "Payment processed successfully",
            });
        }

        /* ------------------------------------------------------------ */
        /* 5️⃣ FAILURE EVENTS                                             */
        /* ------------------------------------------------------------ */

        if (
            ["payment.failed", "payment.expired", "payment.cancelled"]
                .includes(eventType)
        ) {

            log("PROCESSING FAILURE EVENT");

            await conn.execute(
                `UPDATE Billing
         SET status = 'unpaid'
         WHERE billing_id = ?`,
                [billing_id]
            );

            await conn.commit();

            return NextResponse.json({
                message: "Payment marked as failed",
            });
        }

        /* ------------------------------------------------------------ */
        /* 6️⃣ IGNORE OTHER EVENTS                                       */
        /* ------------------------------------------------------------ */

        await conn.rollback();
        return NextResponse.json({ message: "No action needed" });

    } catch (err: any) {
        if (conn) await conn.rollback();
        console.error("💥 WEBHOOK ERROR:", err);

        return NextResponse.json(
            { message: "Webhook processing failed" },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}
