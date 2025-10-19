import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IdRow = RowDataPacket & { subscription_id: number };

export async function POST(req: NextRequest) {
    let connection: mysql.Connection | null = null;

    try {
        const body = await req.json();
        const requestReferenceNumber = String(body?.requestReferenceNumber || "").trim();
        const landlord_id = Number(body?.landlord_id);
        const plan_name = String(body?.plan_name || "").trim();
        const amount = Number(body?.amount);

        // Validate inputs
        if (!requestReferenceNumber || !Number.isFinite(landlord_id) || !plan_name || !Number.isFinite(amount)) {
            return NextResponse.json(
                { error: "Missing or invalid parameters." },
                { status: 400 }
            );
        }

        const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
        connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        // --- ACID transaction start ---
        await connection.execute("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        await connection.beginTransaction();

        // 1) Idempotency check (lock the row if it exists)
        const [existing] = await connection.execute<IdRow[]>(
            "SELECT subscription_id FROM Subscription WHERE request_reference_number = ? LIMIT 1 FOR UPDATE",
            [requestReferenceNumber]
        );

        if (existing.length > 0) {
            // Already processed — return success idempotently
            await connection.commit();
            return NextResponse.json(
                { message: "Subscription already activated (idempotent).", requestReferenceNumber },
                { status: 200 }
            );
        }

        // 2) Lock current active subscription rows for this landlord to avoid race conditions
        await connection.execute(
            "SELECT subscription_id FROM Subscription WHERE landlord_id = ? AND is_active = 1 FOR UPDATE",
            [landlord_id]
        );

        // 3) Deactivate any active subscriptions for this landlord (safe even if none)
        await connection.execute(
            "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ? AND is_active = 1",
            [landlord_id]
        );

        // 4) Insert new subscription
        const now = new Date();
        const start_date = new Date(now.getTime() - now.getTimezoneOffset() * 60000) // normalize to UTC date
            .toISOString()
            .split("T")[0];

        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);
        const end_date = new Date(end.getTime() - end.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];

        await connection.execute(
            `INSERT INTO Subscription
        (landlord_id, plan_name, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, amount_paid, is_active)
       VALUES (?, ?, ?, ?, 'paid', NOW(), ?, 0, ?, 1)`,
            [landlord_id, plan_name, start_date, end_date, requestReferenceNumber, amount]
        );

        await connection.commit();
        // --- ACID transaction end ---

        return NextResponse.json(
            { message: "Subscription activated successfully.", requestReferenceNumber },
            { status: 200 }
        );
    } catch (err: any) {
        if (connection) {
            try { await connection.rollback(); } catch {}
        }
        const msg = err?.message || String(err);
        const isDup = /duplicate/i.test(msg);
        if (isDup) {
            return NextResponse.json(
                { message: "Subscription already activated.", detail: msg },
                { status: 200 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update subscription.", details: msg },
            { status: 500 }
        );
    } finally {
        if (connection) {
            try { await connection.end(); } catch {}
        }
    }
}

export async function GET() {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
