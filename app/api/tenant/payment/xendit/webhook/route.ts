import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

async function getDbConnection() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

export async function POST(req: Request) {
    let body;
    try {
        body = await req.json();
        console.log("Webhook payload:", body);
    } catch (err) {
        console.error("Invalid JSON:", err);
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    // Verify webhook token
    const token = req.headers.get("x-callback-token");
    if (token !== process.env.XENDIT_TEXT_WEBHOOK_TOKEN) {
        console.warn("Invalid webhook token:", token);
        return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { external_id, status, paid_at, id, amount, payment_method } = body;

    if (!external_id || !status || !id || !amount || !paid_at) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (status !== "PAID") {
        return NextResponse.json({ message: "Ignored" });
    }

    const billing_id = external_id.replace("billing-", ""); // VARCHAR
    let conn: mysql.Connection | undefined;

    try {
        conn = await getDbConnection();

        // Fetch billing
        const [billingRows] = await conn.execute(
            `SELECT billing_id, lease_id, status
       FROM Billing
       WHERE billing_id = ?
       LIMIT 1`,
            [billing_id]
        );

        const billing = (billingRows as any[])[0];
        if (!billing) return NextResponse.json({ message: "Billing not found" }, { status: 404 });
        if (billing.status === "paid") return NextResponse.json({ message: "Already paid" });

        const paidAt = new Date(paid_at);

        // Start transaction
        await conn.beginTransaction();

        // Update billing
        await conn.execute(
            `UPDATE Billing
       SET status = 'paid', paid_at = ?
       WHERE billing_id = ?`,
            [paidAt, billing_id]
        );

        // Insert payment
        await conn.execute(
            `INSERT INTO Payment (
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
      ) VALUES (?, ?, 'rent', ?, ?, 'confirmed', ?, ?, NOW(), NOW())`,
            [billing.billing_id, billing.lease_id, amount, payment_method?.type || "UNKNOWN", id, paidAt]
        );

        await conn.commit();

        return NextResponse.json({ message: "OK" });
    } catch (err: any) {
        if (conn) await conn.rollback().catch(() => {});
        console.error("Webhook processing error:", err);
        return NextResponse.json({ message: "Failed", error: err.message }, { status: 500 });
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}
