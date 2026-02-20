/* -------------------------------------------------------------------------- */
/* XENDIT INVOICE.PAID WEBHOOK (TRANSACTION_ID = payment_id)                 */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

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
/* FETCH TRANSACTION                                                          */
/* -------------------------------------------------------------------------- */

async function fetchTransactionDetails(
    transactionId: string,
    subAccountId: string
) {
    const response = await fetch(
        `https://api.xendit.co/transactions?product_id=${transactionId}`,
        {
            method: "GET",
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
                "for-user-id": subAccountId,
            },
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Transaction API error: ${errText}`);
    }

    const tx = await response.json();

    return {
        gatewayFee: Number(tx.fee?.xendit_fee || 0),
        gatewayVAT: Number(tx.fee?.value_added_tax || 0),
        netAmount: Number(tx.net_amount || 0),
    };
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK HANDLER                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | null = null;

    try {
        /* ---------------- VERIFY TOKEN ---------------- */

        const token = req.headers.get("x-callback-token");

        if (token !== XENDIT_WEBHOOK_TOKEN) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        /* ---------------- PARSE PAYLOAD ---------------- */

        const payload = await req.json();

        if (payload.status !== "PAID") {
            return NextResponse.json({ message: "Ignored" });
        }

        const {
            external_id,
            paid_at,
            payment_id,
            user_id,
            paid_amount,
            amount,
            id: invoice_id,
        } = payload;

        if (!payment_id || !user_id) {
            throw new Error("Missing payment_id or user_id");
        }

        if (!external_id || !external_id.startsWith("billing-")) {
            throw new Error("Invalid external_id");
        }

        const billing_id = external_id.replace("billing-", "");
        const paidAmount = Number(paid_amount || amount);
        const paidAt = new Date(paid_at);

        /* ---------------- FETCH TRANSACTION DETAILS ---------------- */

        const { gatewayFee, gatewayVAT, netAmount } =
            await fetchTransactionDetails(payment_id, user_id);

        /* ---------------- DB TRANSACTION ---------------- */

        conn = await getDbConnection();
        await conn.beginTransaction();

        const [rows]: any = await conn.execute(
            `
      SELECT 
        b.billing_id,
        b.lease_id,
        p.property_id,
        p.property_name,
        un.unit_name,
        landlordUser.user_id AS landlord_user_id,
        tenantUser.firstName AS tenant_first_name,
        tenantUser.lastName AS tenant_last_name
      FROM Billing b
      JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
      JOIN Unit un ON la.unit_id = un.unit_id
      JOIN Property p ON un.property_id = p.property_id
      JOIN Landlord l ON p.landlord_id = l.landlord_id
      JOIN User landlordUser ON l.user_id = landlordUser.user_id
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN User tenantUser ON t.user_id = tenantUser.user_id
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

        /* ---------------- DECRYPT TENANT NAME ---------------- */

        const decryptedFirstName = safeDecrypt(billing.tenant_first_name);
        const decryptedLastName = safeDecrypt(billing.tenant_last_name);

        const tenantFullName = `${decryptedFirstName} ${decryptedLastName}`;

        /* ---------------- UPDATE BILLING ---------------- */

        await conn.execute(
            `UPDATE Billing SET status='paid', paid_at=? WHERE billing_id=?`,
            [paidAt, billing_id]
        );

        /* ---------------- INSERT PAYMENT ---------------- */

        await conn.execute(
            `
      INSERT INTO Payment (
        agreement_id,
        payment_type,
        amount_paid,
        payment_method_id,
        payment_status,
        receipt_reference,
        payment_date,
        created_at,
        updated_at
      )
      VALUES (?, 'billing', ?, 1, 'confirmed', ?, ?, NOW(), NOW())
      `,
            [billing.lease_id, paidAmount, invoice_id, paidAt]
        );

        /* ---------------- SEND DETAILED NOTIFICATION ---------------- */

        await sendUserNotification({
            userId: billing.landlord_user_id,
            title: "💰 Rent Payment Received",
            body: `${tenantFullName} from ${billing.property_name} - ${billing.unit_name} paid ₱${paidAmount.toLocaleString(
                "en-PH",
                { minimumFractionDigits: 2 }
            )}.`,
            url: `/pages/landlord/properties/${billing.property_id}/payments?id=${billing.property_id}`,
            conn,
        });

        await conn.commit();

        return NextResponse.json({
            message: "Invoice reconciliation complete",
        });

    } catch (err: any) {
        if (conn) await conn.rollback();

        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}