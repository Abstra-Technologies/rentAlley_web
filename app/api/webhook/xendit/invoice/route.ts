/* -------------------------------------------------------------------------- */
/* XENDIT INVOICE.PAID WEBHOOK (PRODUCT_ID VERSION)                          */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

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
/* DEBUG                                                                      */
/* -------------------------------------------------------------------------- */

function debug(stage: string, data?: any) {
    console.log(`\n================ ${stage} ================`);
    if (data !== undefined) {
        console.log(JSON.stringify(data, null, 2));
    }
}

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
/* FETCH TRANSACTION USING product_id (LIKE SPLIT WEBHOOK)                   */
/* -------------------------------------------------------------------------- */

async function fetchTransactionDetails(
    invoiceId: string,
    subAccountId: string
) {
    debug("FETCHING TRANSACTION USING product_id", {
        invoiceId,
        subAccountId,
    });

    const txResp = await fetch(
        `https://api.xendit.co/transactions?product_id=${invoiceId}`,
        {
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
                "for-user-id": subAccountId, // 🔥 REQUIRED
            },
        }
    );

    if (!txResp.ok) {
        const errText = await txResp.text();
        throw new Error(`Transaction API error: ${errText}`);
    }

    const txData = await txResp.json();

    if (!Array.isArray(txData.data) || txData.data.length === 0) {
        throw new Error("No PAYMENT transaction found");
    }

    const paymentTx =
        txData.data.find((tx: any) => tx.type === "PAYMENT") ||
        txData.data[0];

    debug("TRANSACTION OBJECT", paymentTx);

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
    let conn: mysql.Connection | null = null;

    try {
        debug("WEBHOOK START");

        /* ---------------- VERIFY TOKEN ---------------- */

        const token = req.headers.get("x-callback-token");

        if (token !== XENDIT_WEBHOOK_TOKEN) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        /* ---------------- PARSE PAYLOAD ---------------- */

        const payload = await req.json();
        debug("PAYLOAD RECEIVED", payload);

        if (payload.status !== "PAID") {
            return NextResponse.json({ message: "Ignored" });
        }

        const {
            external_id,
            paid_at,
            id: invoice_id,    // 🔥 THIS IS product_id
            user_id,           // 🔥 SUBACCOUNT ID
            paid_amount,
            amount,
            payment_method,
            payment_id,        // store only
        } = payload;

        if (!invoice_id || !user_id) {
            throw new Error("Missing invoice_id or user_id");
        }

        if (!external_id.startsWith("billing-")) {
            throw new Error("Invalid external_id");
        }

        const billing_id = external_id.replace("billing-", "");
        const paidAmount = Number(paid_amount || amount);
        const paidAt = new Date(paid_at);

        debug("EXTRACTED VALUES", {
            billing_id,
            invoice_id,
            user_id,
        });

        /* ------------------------------------------------------------------ */
        /* 1️⃣ FETCH TRANSACTION (LIKE SPLIT LOGIC)                           */
        /* ------------------------------------------------------------------ */

        const { gatewayFee, gatewayVAT, netAmount } =
            await fetchTransactionDetails(invoice_id, user_id);

        /* ------------------------------------------------------------------ */
        /* 2️⃣ UPDATE DATABASE                                                */
        /* ------------------------------------------------------------------ */

        conn = await getDbConnection();
        await conn.beginTransaction();

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
            throw new Error("Billing not found");
        }

        const billing = rows[0];

        /* ---- UPDATE BILLING ---- */

        await conn.execute(
            `UPDATE Billing SET status='paid', paid_at=? WHERE billing_id=?`,
            [paidAt, billing_id]
        );

        /* ---- INSERT PAYMENT ---- */

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
                0, // split webhook will update platform_fee if exists
                payment_method || "UNKNOWN",
                invoice_id,
                payment_id,
                JSON.stringify(payload),
                paidAt,
            ]
        );

        await sendUserNotification({
            userId: billing.landlord_user_id,
            title: "Payment Received",
            body: `A tenant has paid ₱${paidAmount.toFixed(2)}.`,
            url: "/pages/landlord/billing",
            conn,
        });

        await conn.commit();

        return NextResponse.json({
            message: "Invoice reconciliation complete",
        });

    } catch (err: any) {
        if (conn) await conn.rollback();

        debug("ERROR OCCURRED", err.message);

        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );

    } finally {
        if (conn) await conn.end();
        debug("WEBHOOK END");
    }
}