/* -------------------------------------------------------------------------- */
/* XENDIT SPLIT.PAYMENT WEBHOOK HANDLER                                      */
/* Handles ONLY platform commission split                                     */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_TEXT_WEBHOOK_TOKEN,
} = process.env;

/* -------------------------------------------------------------------------- */
/* DEBUG HELPER                                                               */
/* -------------------------------------------------------------------------- */

function debug(stage: string, data?: any) {
    console.log(`\n==================== ${stage} ====================`);
    if (data) console.log(JSON.stringify(data, null, 2));
}

/* -------------------------------------------------------------------------- */
/* DB CONNECTION                                                              */
/* -------------------------------------------------------------------------- */

async function getDbConnection() {
    debug("DB CONNECTING");
    const conn = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
    debug("DB CONNECTED");
    return conn;
}

/* -------------------------------------------------------------------------- */
/* SPLIT WEBHOOK HANDLER                                                      */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
    let conn: mysql.Connection | null = null;

    try {
        debug("SPLIT WEBHOOK START");

        /* ---------------- VERIFY TOKEN ---------------- */
        const token = req.headers.get("x-callback-token");
        debug("TOKEN RECEIVED", token);

        if (token !== XENDIT_TEXT_WEBHOOK_TOKEN) {
            debug("TOKEN INVALID");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        debug("TOKEN VERIFIED");

        /* ---------------- PARSE BODY ---------------- */
        const payload = await req.json();
        debug("PAYLOAD RECEIVED", payload);

        /* ---------------- VALIDATE EVENT ---------------- */
        if (payload.event !== "split.payment") {
            debug("NOT split.payment EVENT");
            return NextResponse.json({ message: "Ignored" });
        }

        const splitData = payload.data;

        if (!splitData) {
            debug("NO SPLIT DATA FOUND");
            return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
        }

        debug("SPLIT DATA", splitData);

        /* ---------------- CHECK PLATFORM SPLIT ---------------- */
        if (splitData.reference_id !== "platform") {
            debug("NOT PLATFORM COMMISSION SPLIT");
            return NextResponse.json({ message: "Ignored (not platform split)" });
        }

        /* ---------------- EXTRACT VALUES ---------------- */
        const commissionAmount = Number(splitData.amount);
        const paymentReference = splitData.payment_reference_id;

        if (!paymentReference || !commissionAmount) {
            debug("MISSING REQUIRED SPLIT VALUES");
            return NextResponse.json({ message: "Invalid split data" }, { status: 400 });
        }

        const billing_id = paymentReference.replace("billing-", "");

        debug("EXTRACTED VALUES", {
            billing_id,
            commissionAmount,
        });

        /* ---------------- UPDATE PAYMENT ---------------- */
        conn = await getDbConnection();
        await conn.beginTransaction();
        debug("TRANSACTION STARTED");

        const [updateResult]: any = await conn.execute(
            `
            UPDATE Payment
            SET gateway_fee = ?
            WHERE bill_id = ?
            ORDER BY payment_id DESC
            LIMIT 1
            `,
            [commissionAmount, billing_id]
        );

        debug("UPDATE RESULT", updateResult);

        if (updateResult.affectedRows === 0) {
            debug("NO PAYMENT ROW FOUND TO UPDATE");
            await conn.rollback();
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        await conn.commit();
        debug("TRANSACTION COMMITTED");

        return NextResponse.json({
            message: "Platform commission recorded successfully",
        });

    } catch (err: any) {

        debug("ERROR OCCURRED", {
            message: err.message,
            stack: err.stack,
        });

        if (conn) {
            await conn.rollback();
            debug("TRANSACTION ROLLED BACK");
        }

        return NextResponse.json(
            { message: "Split webhook failed", error: err.message },
            { status: 500 }
        );

    } finally {
        if (conn) {
            await conn.end();
            debug("DB CONNECTION CLOSED");
        }

        debug("SPLIT WEBHOOK END");
    }
}
