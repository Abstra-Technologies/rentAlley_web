import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export const runtime = "nodejs";

/* -------------------------------------------------------------------------- */
/* DB CONNECTION                                                              */
/* -------------------------------------------------------------------------- */
async function getDbConnection() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

/* -------------------------------------------------------------------------- */
/* WEBHOOK HANDLER (INVOICE.PAID ONLY)                                       */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
    let payload: any;

    /* -------------------- PARSE BODY -------------------- */
    try {
        payload = await req.json();
        console.log("✅ INVOICE WEBHOOK HIT:", payload);
    } catch {
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    /* -------------------- VERIFY TOKEN -------------------- */
    const token = req.headers.get("x-callback-token");
    if (token !== process.env.XENDIT_TEXT_WEBHOOK_TOKEN) {
        return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    /* -------------------- VALIDATE EVENT -------------------- */
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

    if (!external_id || !invoice_id || !paid_at) {
        return NextResponse.json(
            { message: "Missing required fields" },
            { status: 400 }
        );
    }

    const paidAmount = Number(paid_amount || amount);
    const paidAt = new Date(paid_at);

    let conn: mysql.Connection | undefined;

    try {
        conn = await getDbConnection();
        await conn.beginTransaction();

        /* ======================================================================
           BILLING PAYMENTS
        ====================================================================== */
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

            const billing = rows[0];
            if (!billing) {
                await conn.rollback();
                return NextResponse.json(
                    { message: "Billing not found" },
                    { status: 404 }
                );
            }

            /* ---- UPDATE BILLING ---- */
            await conn.execute(
                `
                UPDATE Billing
                SET status = 'paid', paid_at = ?
                WHERE billing_id = ?
                `,
                [paidAt, billing_id]
            );

            /* ---- INSERT PAYMENT RECORD (NO FEE DEDUCTION) ---- */
            await conn.execute(
                `
                INSERT INTO Payment (
                    bill_id,
                    agreement_id,
                    payment_type,
                    amount_paid,
                    gross_amount,
                    net_amount,
                    payment_method_id,
                    payment_status,
                    receipt_reference,
                    gateway_transaction_ref,
                    raw_gateway_payload,
                    payment_date,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, 'monthly_billing', ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, NOW(), NOW())
                `,
                [
                    billing.billing_id,
                    billing.lease_id,
                    paidAmount,
                    paidAmount,
                    paidAmount, // net same as gross (split handled separately)
                    payment_method || "UNKNOWN",
                    invoice_id,
                    invoice_id,
                    JSON.stringify(payload),
                    paidAt,
                ]
            );

            /* 🔔 Notify landlord */
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

        /* ======================================================================
           INITIAL PAYMENTS (ADVANCE / DEPOSIT)
        ====================================================================== */
        const match = external_id.match(/^init-(advance|deposit)-([^-]+)/);
        if (!match) {
            await conn.rollback();
            return NextResponse.json(
                { message: "Unrecognized external_id" },
                { status: 400 }
            );
        }

        const paymentType =
            match[1] === "advance"
                ? "advance_payment"
                : "security_payment";

        const agreement_id = match[2];

        await conn.execute(
            `
            INSERT INTO Payment (
                agreement_id,
                payment_type,
                amount_paid,
                gross_amount,
                net_amount,
                payment_method_id,
                payment_status,
                receipt_reference,
                gateway_transaction_ref,
                raw_gateway_payload,
                payment_date,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, NOW(), NOW())
            `,
            [
                agreement_id,
                paymentType,
                paidAmount,
                paidAmount,
                paidAmount,
                payment_method || "UNKNOWN",
                invoice_id,
                invoice_id,
                JSON.stringify(payload),
                paidAt,
            ]
        );

        await conn.commit();
        return NextResponse.json({ message: "Initial payment processed" });

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
