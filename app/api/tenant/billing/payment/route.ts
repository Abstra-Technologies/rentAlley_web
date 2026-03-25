/* -------------------------------------------------------------------------- */
/* PAYMENT GATEWAY INITIALIZATION ON XENDIT (SUBACCOUNT REQUIRED BUILD)     */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";
import { createXenditCustomer } from "@/lib/payments/xenditCustomer";

/* -------------------------------------------------------------------------- */
/* Environment                                                                */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_SECRET_KEY,
} = process.env;

const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";
const CURRENCY = "PHP";

/* -------------------------------------------------------------------------- */
/* Debug Logger                                                               */
/* -------------------------------------------------------------------------- */

function debug(label: string, data?: any) {
    console.log(`\n=========== XENDIT DEBUG :: ${label} ===========`);
    if (data) console.log(JSON.stringify(data, null, 2));
    console.log("================================================\n");
}

function httpError(status: number, message: string, extra?: any) {
    debug("HTTP ERROR", { status, message, extra });

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

function formatBillingPeriod(date: string | Date) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

/* -------------------------------------------------------------------------- */
/* POST: CREATE INVOICE                                                       */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* PAYMENT INIT (PLATFORM ONLY - NO SUBACCOUNT)                               */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
    let conn: mysql.Connection | null = null;

    try {
        const body = await req.json();

        const {
            amount,
            billing_id,
            tenant_id,
            redirectUrl,
            firstName,
            lastName,
            emailAddress,
        } = body;

        if (!amount || !billing_id || !tenant_id) {
            return httpError(400, "Missing required fields.");
        }

        if (!redirectUrl?.success || !redirectUrl?.failure) {
            return httpError(400, "Missing redirect URLs.");
        }

        if (!XENDIT_SECRET_KEY) {
            return httpError(500, "Xendit secret key not configured.");
        }

        conn = await getDbConnection();

        const [rows]: any = await conn.execute(
            `
            SELECT
                b.billing_id,
                b.lease_id AS agreement_id,
                b.billing_period,
                b.total_amount_due,
                u.unit_name,
                p.property_name,
                l.landlord_id,
                l.xendit_account_id
            FROM Billing b
            JOIN LeaseAgreement la ON b.lease_id = la.agreement_id
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            JOIN Landlord l ON p.landlord_id = l.landlord_id
            WHERE b.billing_id = ?
            LIMIT 1
            `,
            [billing_id]
        );

        if (!rows.length) {
            return httpError(404, "Billing not found.");
        }

        const billing = rows[0];

        /* ---------------- CUSTOMER (PLATFORM ONLY) ---------------- */

        const [tenantRows]: any = await conn.execute(
            `SELECT xendit_customer_id FROM Tenant WHERE tenant_id = ? LIMIT 1`,
            [tenant_id]
        );

        let xenditCustomerId = tenantRows?.[0]?.xendit_customer_id ?? null;

        if (!xenditCustomerId) {
            xenditCustomerId = await createXenditCustomer({
                referenceId: `tenant-${tenant_id}`,
                firstName,
                lastName,
                email: emailAddress,
                secretKey: XENDIT_SECRET_KEY,
            });

            await conn.execute(
                `UPDATE Tenant SET xendit_customer_id = ? WHERE tenant_id = ?`,
                [xenditCustomerId, tenant_id]
            );
        }

        /* ---------------- IDEMPOTENCY ---------------- */

        const idempotencyKey = crypto
            .createHash("sha256")
            .update(`billing-${billing.billing_id}`)
            .digest("hex");

        /* ---------------- REDIRECTS ---------------- */

        const successRedirectUrl =
            `${redirectUrl.success}?billing_id=${billing.billing_id}`;

        const failureRedirectUrl =
            `${redirectUrl.failure}?billing_id=${billing.billing_id}`;

        /* ---------------- INVOICE ---------------- */

        const invoicePayload = {
            external_id: `billing-${billing.billing_id}`,
            amount: Number(amount),
            currency: "PHP",
            description: `Billing for ${billing.property_name} - ${billing.unit_name}
Billing Period: ${formatBillingPeriod(billing.billing_period)}`,
            customer: {
                customer_id: xenditCustomerId,
            },
            success_redirect_url: successRedirectUrl,
            failure_redirect_url: failureRedirectUrl,
        };

        const headers = {
            "Content-Type": "application/json",
            Authorization:
                "Basic " +
                Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64"),
            "Idempotency-Key": idempotencyKey,
        };

        const response = await fetch("https://api.xendit.co/v2/invoices", {
            method: "POST",
            headers,
            body: JSON.stringify(invoicePayload),
        });

        const data = await response.json();

        if (!response.ok) {
            return httpError(response.status, "Invoice creation failed", data);
        }

        return NextResponse.json({
            success: true,
            checkoutUrl: data.invoice_url,
            invoiceId: data.id,
        });

    } catch (err: any) {
        return httpError(500, "Payment initialization failed.", err?.message);
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}