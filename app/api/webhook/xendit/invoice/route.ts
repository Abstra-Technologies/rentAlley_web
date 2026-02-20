import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export const runtime = "nodejs";

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_WEBHOOK_TOKEN,
    XENDIT_TRANSBAL_KEY,
} = process.env;

/* -------------------------------------------------------------------------- */
/* DB CONNECTION                                                              */
/* -------------------------------------------------------------------------- */

async function getDbConnection() {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

/* -------------------------------------------------------------------------- */
/* FETCH TRANSACTION DETAILS                                                  */
/* -------------------------------------------------------------------------- */

async function fetchTransactionDetails(invoiceId: string) {
    const response = await fetch(
        `https://api.xendit.co/transactions?reference_id=${invoiceId}`,
        {
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
            },
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Transaction fetch failed: ${err}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.data) || data.data.length === 0) {
        throw new Error("No transaction found");
    }

    const paymentTx =
        data.data.find((tx: any) => tx.type === "PAYMENT") ||
        data.data[0];

    return {
        gatewayFee: Number(paymentTx.fee?.xendit_fee || 0),
        gatewayVAT: Number(paymentTx.fee?.value_added_tax || 0),
        netAmount: Number(paymentTx.net_amount || 0),
    };
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK HANDLER                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | undefined;

    try {
        const token = req.headers.get("x-callback-token");

        if (token !== XENDIT_WEBHOOK_TOKEN) {
            return NextResponse.json({ message: "Invalid token" }, { status: 401 });
        }

        const payload = await req.json();

        if (payload.status !== "PAID") {
            return NextResponse.json({ message: "Ignored" });
        }

        const {
            external_id,
            paid_at,
            id: invoice_id,
            paid_amount,
            amount,
            payment_method,
        } = payload;

        const paidAmount = Number(paid_amount || amount);
        const paidAt = new Date(paid_at);

        conn = await getDbConnection();
        await conn.beginTransaction();

        /* ====================================================================== */
        /* BILLING PAYMENTS                                                       */
        /* ====================================================================== */

        if (external_id.startsWith("billing-")) {
            const billing_id = external_id.replace("billing-", "");

            const [rows]: any = await conn.execute(
                `
        SELECT 
          b.billing_id,
          b.lease_id,
          u.user_id AS landlord_user_id
        FROM Billing b
        JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
        JOIN Unit un ON la.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        JOIN Landlord l ON p.landlord_id = l.landlord_id
        JOIN User u ON l.user_id = u.user_id
        WHERE b.billing_id = ?
        LIMIT 1
        `,
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

            /* ---------------- UPDATE BILLING ---------------- */

            await conn.execute(
                `UPDATE Billing SET status='paid', paid_at=? WHERE billing_id=?`,
                [paidAt, billing_id]
            );

            /* ---------------- FETCH TRANSACTION FEES ---------------- */

            const { gatewayFee, gatewayVAT, netAmount } =
                await fetchTransactionDetails(invoice_id);

            /* No split rule = no platform fee */
            const platformFee = 0;

            /* ---------------- INSERT PAYMENT RECORD ---------------- */

            await conn.execute(
                `
        INSERT INTO Payment (
          bill_id,
          agreement_id,
          payment_type,
          amount_paid,
          gross_amount,
          net_amount,
          gateway_fee,
          gateway_vat,
          platform_fee,
          payment_method_id,
          payment_status,
          receipt_reference,
          gateway_transaction_ref,
          raw_gateway_payload,
          payment_date,
          created_at,
          updated_at
        )
        VALUES (?, ?, 'monthly_billing', ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, NOW(), NOW())
        `,
                [
                    billing.billing_id,
                    billing.lease_id,
                    paidAmount,
                    paidAmount,
                    netAmount,
                    gatewayFee,
                    gatewayVAT,
                    platformFee,
                    payment_method || "UNKNOWN",
                    invoice_id,
                    invoice_id,
                    JSON.stringify(payload),
                    paidAt,
                ]
            );

            /* ---------------- NOTIFY LANDLORD ---------------- */

            await sendUserNotification({
                userId: billing.landlord_user_id,
                title: "Payment Received",
                body: `A tenant has paid ₱${paidAmount.toFixed(2)}.`,
                url: "/pages/landlord/billing",
                conn,
            });

            await conn.commit();
            return NextResponse.json({ message: "Billing payment processed" });
        }

        await conn.rollback();
        return NextResponse.json({ message: "Unrecognized external_id" });

    } catch (err: any) {
        if (conn) await conn.rollback();

        console.error("❌ Invoice Webhook Error:", err);

        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}