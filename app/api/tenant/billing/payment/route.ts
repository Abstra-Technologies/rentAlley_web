/* -------------------------------------------------------------------------- */
/* PAYMENT GATEWAY INITIALIZATION - XENDIT PLATFORM V3                       */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_TEXT_SECRET_KEY,
} = process.env;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function log(step: string, data?: any) {
    console.log(`\n========== ${step} ==========\n`);
    if (data) console.log(JSON.stringify(data, null, 2));
}

function httpError(status: number, message: string, extra?: any) {
    return NextResponse.json(
        { error: message, ...(extra ? { details: extra } : {}) },
        { status }
    );
}

async function getDbConnection() {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
    });
}

/* -------------------------------------------------------------------------- */
/* POST                                                                       */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
    let conn: mysql.Connection | null = null;

    try {
        log("START PAYMENT INIT");

        const body = await req.json();
        const { billing_id, redirectUrl } = body;

        if (!billing_id) {
            return httpError(400, "Missing billing_id");
        }

        if (!redirectUrl?.success || !redirectUrl?.failure) {
            return httpError(400, "Missing redirect URLs");
        }

        if (!XENDIT_TEXT_SECRET_KEY) {
            return httpError(500, "Missing Xendit Secret Key");
        }

        conn = await getDbConnection();

        /* ------------------------------------------------------------------ */
        /* FETCH BILLING + SUBACCOUNT + SPLIT RULE                            */
        /* ------------------------------------------------------------------ */

        const [rows]: any = await conn.execute(
            `
      SELECT 
        b.billing_id,
        b.total_amount_due,
        la.agreement_id,
        l.landlord_id,
        l.xendit_account_id,
        s.plan_code,
        s.is_active,
        pl.split_rule_id
      FROM Billing b
      JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      JOIN Landlord l ON p.landlord_id = l.landlord_id
      LEFT JOIN Subscription s 
          ON s.landlord_id = l.landlord_id 
          AND s.is_active = 1
      LEFT JOIN Plan pl 
          ON pl.plan_code = s.plan_code
      WHERE b.billing_id = ?
      LIMIT 1
      `,
            [billing_id]
        );

        if (!rows.length) {
            return httpError(404, "Billing not found");
        }

        const data = rows[0];
        log("DATABASE RESULT", data);

        if (!data.xendit_account_id) {
            return httpError(400, "Landlord sub-account not configured");
        }

        if (!data.is_active) {
            return httpError(400, "No active subscription");
        }

        if (!data.split_rule_id) {
            return httpError(400, "Split rule missing in plan");
        }

        const grossAmount = Number(data.total_amount_due);

        /* ------------------------------------------------------------------ */
        /* BUILD V3 PAYMENT REQUEST BODY (NO SPLIT RULE HERE)                */
        /* ------------------------------------------------------------------ */

        const paymentPayload = {
            reference_id: `billing-${data.billing_id}-${Date.now()}`,
            type: "PAY",
            country: "PH",
            currency: "PHP",
            request_amount: grossAmount,
            capture_method: "AUTOMATIC",
            channel_code: "GCASH",

            channel_properties: {
                success_return_url:
                    `${redirectUrl.success}?billing_id=${data.billing_id}`,
                failure_return_url:
                    `${redirectUrl.failure}?billing_id=${data.billing_id}`,
            },

            metadata: {
                billing_id: data.billing_id,
                landlord_id: data.landlord_id,
                agreement_id: data.agreement_id,
                plan_code: data.plan_code,
            },
        };

        log("XENDIT REQUEST BODY", paymentPayload);

        /* ------------------------------------------------------------------ */
        /* CALL XENDIT (V3 CORRECT HEADERS)                                  */
        /* ------------------------------------------------------------------ */

        const response = await fetch(
            "https://api.xendit.co/v3/payment_requests",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-version": "2024-11-11",
                    Authorization:
                        "Basic " +
                        Buffer.from(`${XENDIT_TEXT_SECRET_KEY}:`).toString("base64"),

                    // 🔥 CORRECT V3 HEADERS
                    "for-user-id": data.xendit_account_id,
                    "with-split-rule": data.split_rule_id,
                },
                body: JSON.stringify(paymentPayload),
            }
        );

        const result = await response.json();
        log("XENDIT RESPONSE", result);

        if (!response.ok) {
            return httpError(500, "Xendit API Error", result);
        }

        /* ------------------------------------------------------------------ */
        /* STORE PAYMENT INIT RECORD                                          */
        /* ------------------------------------------------------------------ */

        await conn.execute(
            `
      INSERT INTO Payment (
        bill_id,
        agreement_id,
        payment_type,
        amount_paid,
        payment_method_id,
        payment_status,
        gross_amount,
        gateway_transaction_ref,
        raw_gateway_payload
      )
      VALUES (?, ?, 'monthly_billing', ?, 'xendit', 'pending', ?, ?, ?)
      `,
            [
                data.billing_id,
                data.agreement_id,
                grossAmount,
                grossAmount,
                result.payment_request_id, // ✅ correct field
                JSON.stringify(result),
            ]
        );

        log("PAYMENT INIT STORED");

        /* ------------------------------------------------------------------ */
        /* EXTRACT CHECKOUT URL                                               */
        /* ------------------------------------------------------------------ */

        let checkoutUrl = null;

        if (result.actions) {
            const redirect = result.actions.find(
                (a: any) =>
                    a.type === "REDIRECT_CUSTOMER" &&
                    a.descriptor === "WEB_URL"
            );
            checkoutUrl = redirect?.value || null;
        }

        return NextResponse.json({
            success: true,
            paymentRequestId: result.payment_request_id,
            checkoutUrl,
        });

    } catch (error: any) {
        log("FATAL ERROR", error);
        return httpError(500, "Payment initialization failed", error.message);
    } finally {
        if (conn) await conn.end();
    }
}
