/* -------------------------------------------------------------------------- */
/* PAYMENT GATEWAY INITIALIZATION - XENDIT V2 INVOICE (SUBACCOUNT SAFE)     */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";

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

const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";

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
        log("START INVOICE INITIALIZATION");

        const body = await req.json();
        const { billing_id, redirectUrl } = body;

        /* ---------------- VALIDATION ---------------- */

        if (!billing_id) {
            return httpError(400, "Missing billing_id");
        }

        if (!redirectUrl?.success || !redirectUrl?.failure) {
            return httpError(400, "Missing redirect URLs");
        }

        if (!XENDIT_TEXT_SECRET_KEY) {
            return httpError(500, "Xendit secret key not configured");
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
        log("BILLING DATA", data);

        /* ---------------- BUSINESS RULES ---------------- */

        if (!data.xendit_account_id) {
            return httpError(400, "Landlord subaccount not configured");
        }

        if (!data.is_active) {
            return httpError(400, "No active subscription");
        }

        const grossAmount = parseFloat(data.total_amount_due);

        if (!grossAmount || isNaN(grossAmount) || grossAmount <= 0) {
            return httpError(400, "Invalid billing amount");
        }

        /* ------------------------------------------------------------------ */
        /* BUILD REDIRECT URLS                                                */
        /* ------------------------------------------------------------------ */

        const successRedirectUrl =
            `${redirectUrl.success}?billing_id=${data.billing_id}` +
            `&agreement_id=${data.agreement_id}` +
            `&amount=${grossAmount}`;

        const failureRedirectUrl =
            `${redirectUrl.failure}?billing_id=${data.billing_id}` +
            `&agreement_id=${data.agreement_id}` +
            `&amount=${grossAmount}`;

        log("REDIRECT URLS", {
            successRedirectUrl,
            failureRedirectUrl,
        });

        /* ------------------------------------------------------------------ */
        /* IDEMPOTENCY                                                        */
        /* ------------------------------------------------------------------ */

        const idempotencyKey = crypto
            .createHash("sha256")
            .update(`billing-${data.billing_id}`)
            .digest("hex");

        /* ------------------------------------------------------------------ */
        /* BUILD INVOICE PAYLOAD                                             */
        /* ------------------------------------------------------------------ */

        const invoicePayload = {
            external_id: `billing-${data.billing_id}-${Date.now()}`,
            amount: grossAmount,
            currency: "PHP",
            description: `Billing Payment`,
            success_redirect_url: successRedirectUrl,
            failure_redirect_url: failureRedirectUrl,
            metadata: {
                billing_id: data.billing_id,
                agreement_id: data.agreement_id,
                landlord_id: data.landlord_id,
                plan_code: data.plan_code,
            },
        };

        log("INVOICE PAYLOAD", invoicePayload);

        /* ------------------------------------------------------------------ */
        /* HEADERS                                                            */
        /* ------------------------------------------------------------------ */

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization:
                "Basic " +
                Buffer.from(`${XENDIT_TEXT_SECRET_KEY}:`).toString("base64"),
            "Idempotency-Key": idempotencyKey,

            // 🔥 ALWAYS ROUTE TO SUBACCOUNT
            "for-user-id": data.xendit_account_id,
        };

        // 🔥 APPLY SPLIT RULE ONLY IF EXISTS
        if (data.split_rule_id) {
            headers["with-split-rule"] = data.split_rule_id;
            log("SPLIT RULE APPLIED", data.split_rule_id);
        } else {
            log("NO SPLIT RULE — 100% TO LANDLORD SUBACCOUNT");
        }

        /* ------------------------------------------------------------------ */
        /* CALL XENDIT                                                        */
        /* ------------------------------------------------------------------ */

        const response = await fetch(XENDIT_API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify(invoicePayload),
        });

        const result = await response.json();
        log("XENDIT RESPONSE", result);

        if (!response.ok) {
            return httpError(500, "Xendit API Error", result);
        }

        /* ------------------------------------------------------------------ */
        /* RETURN CHECKOUT                                                    */
        /* ------------------------------------------------------------------ */

        return NextResponse.json({
            success: true,
            invoiceId: result.id,
            checkoutUrl: result.invoice_url,
            billing_id: data.billing_id,
            agreement_id: data.agreement_id,
        });

    } catch (error: any) {
        log("FATAL ERROR", error);
        return httpError(500, "Payment initialization failed", error.message);
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}