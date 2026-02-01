import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

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
/* WEBHOOK HANDLER                                                            */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
    let payload: any;

    /* -------------------- PARSE BODY -------------------- */
    try {
        payload = await req.json();
        console.log("✅ XENDIT WEBHOOK HIT:", payload);
    } catch {
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    /* -------------------- VERIFY TOKEN -------------------- */
    const token = req.headers.get("x-callback-token");
    if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
        return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const {
        external_id,
        status,
        paid_at,
        id: invoice_id,
        amount,
        payment_method,
    } = payload;

    if (!external_id || !status || !invoice_id || !paid_at) {
        return NextResponse.json(
            { message: "Missing required fields" },
            { status: 400 }
        );
    }

    if (status !== "PAID") {
        return NextResponse.json({ message: "Ignored" });
    }

    let conn: mysql.Connection | undefined;

    try {
        conn = await getDbConnection();
        await conn.beginTransaction();

        const paidAt = new Date(paid_at);

        /* ======================================================================
           BILLING PAYMENTS (UNCHANGED)
           ====================================================================== */
        if (external_id.startsWith("billing-")) {
            const billing_id = external_id.replace("billing-", "");

            const [billingRows]: any = await conn.execute(
                `
        SELECT billing_id, lease_id, status
        FROM Billing
        WHERE billing_id = ?
        LIMIT 1
        `,
                [billing_id]
            );

            const billing = billingRows[0];
            if (!billing) {
                await conn.rollback();
                return NextResponse.json(
                    { message: "Billing not found" },
                    { status: 404 }
                );
            }

            if (billing.status !== "paid") {
                await conn.execute(
                    `
          UPDATE Billing
          SET status = 'paid', paid_at = ?
          WHERE billing_id = ?
          `,
                    [paidAt, billing_id]
                );

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
            created_at,
            updated_at
          )
          VALUES (?, ?, 'monthly_billing', ?, ?, 'confirmed', ?, ?, NOW(), NOW())
          `,
                    [
                        billing.billing_id,
                        billing.lease_id,
                        amount,
                        payment_method || "UNKNOWN",
                        invoice_id,
                        paidAt,
                    ]
                );
            }

            await conn.commit();
            return NextResponse.json({ message: "Billing payment processed" });
        }

        /* ======================================================================
           INITIAL PAYMENTS (ADVANCE / DEPOSIT)
           ====================================================================== */

        /**
         * external_id format:
         * init-{advance|deposit}-{agreement_id}-{timestamp}
         */
        const match = external_id.match(
            /^init-(advance|deposit)-([^-]+)/
        );

        if (!match) {
            await conn.rollback();
            return NextResponse.json(
                { message: "Unrecognized external_id" },
                { status: 400 }
            );
        }

        const paymentType = match[1]; // advance | deposit
        const agreement_id = match[2];

        console.log("📌 Parsed initial payment:", {
            paymentType,
            agreement_id,
        });

        /* -------------------- FETCH LEASE -------------------- */
        const [leaseRows]: any = await conn.execute(
            `
      SELECT tenant_id
      FROM LeaseAgreement
      WHERE agreement_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        if (!leaseRows.length) {
            await conn.rollback();
            return NextResponse.json(
                { message: "Lease agreement not found" },
                { status: 404 }
            );
        }

        const tenant_id = leaseRows[0].tenant_id;

        /* -------------------- ADVANCE PAYMENT -------------------- */
        if (paymentType === "advance") {
            await conn.execute(
                `
        INSERT INTO AdvancePayment
          (lease_id, tenant_id, amount, status, received_at)
        VALUES (?, ?, ?, 'paid', ?)
        ON DUPLICATE KEY UPDATE
          status = 'paid',
          received_at = VALUES(received_at),
          updated_at = NOW()
        `,
                [agreement_id, tenant_id, amount, paidAt]
            );

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
        VALUES (?, 'advance_payment', ?, ?, 'confirmed', ?, ?, NOW(), NOW())
        `,
                [
                    agreement_id,
                    amount,
                    payment_method || "UNKNOWN",
                    invoice_id,
                    paidAt,
                ]
            );
        }

        /* -------------------- SECURITY DEPOSIT -------------------- */
        if (paymentType === "deposit") {
            await conn.execute(
                `
        INSERT INTO SecurityDeposit
          (lease_id, tenant_id, amount, status, received_at)
        VALUES (?, ?, ?, 'paid', ?)
        ON DUPLICATE KEY UPDATE
          status = 'paid',
          received_at = VALUES(received_at),
          updated_at = NOW()
        `,
                [agreement_id, tenant_id, amount, paidAt]
            );

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
        VALUES (?, 'security_deposit', ?, ?, 'confirmed', ?, ?, NOW(), NOW())
        `,
                [
                    agreement_id,
                    amount,
                    payment_method || "UNKNOWN",
                    invoice_id,
                    paidAt,
                ]
            );
        }

        await conn.commit();
        return NextResponse.json({ message: "Initial payment processed" });

    } catch (err: any) {
        if (conn) await conn.rollback().catch(() => {});
        console.error("❌ Webhook processing error:", err);
        return NextResponse.json(
            { message: "Webhook failed", error: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}
