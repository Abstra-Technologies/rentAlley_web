import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { createXenditCustomer } from "@/lib/payments/xenditCustomer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
function httpError(status: number, message: string, extra?: any) {
    return NextResponse.json(
        { error: message, ...(extra ? { details: extra } : {}) },
        { status }
    );
}

async function getDbConnection() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
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
/* POST: Create Xendit Invoice (WITH CUSTOMER LIB)                             */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
    let body: any;

    try {
        body = await req.json();
    } catch {
        return httpError(400, "Invalid JSON body.");
    }

    // ✅ destructure user identity fields
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
        return httpError(400, "Missing amount, billing_id, or tenant_id.");
    }

    if (!redirectUrl?.success || !redirectUrl?.failure) {
        return httpError(400, "Missing redirect URLs (success, failure).");
    }

    const secretKey = process.env.XENDIT_SECRET_KEY;
    if (!secretKey) {
        return httpError(500, "Xendit Secret Key not configured.");
    }

    let conn: mysql.Connection | undefined;

    try {
        conn = await getDbConnection();

        /* ---------------------------------------------------------------------- */
        /* Fetch billing context                                                   */
        /* ---------------------------------------------------------------------- */
        const [billingRows]: any = await conn.execute(
            `
      SELECT
        b.billing_id,
        b.lease_id AS agreement_id,
        b.billing_period,
        u.unit_name,
        p.property_name
      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE b.billing_id = ?
      LIMIT 1
      `,
            [billing_id]
        );

        if (!billingRows.length) {
            return httpError(404, "Billing not found.");
        }

        const billing = billingRows[0];

        /* ---------------------------------------------------------------------- */
        /* Get or Create Xendit Customer (via LIB)                                 */
        /* ---------------------------------------------------------------------- */
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
                secretKey,
            });

            await conn.execute(
                `UPDATE Tenant SET xendit_customer_id = ? WHERE tenant_id = ?`,
                [xenditCustomerId, tenant_id]
            );
        }

        /* ---------------------------------------------------------------------- */
        /* Xendit Invoice Payload                                                  */
        /* ---------------------------------------------------------------------- */
        const invoicePayload = {
            external_id: `billing-${billing.billing_id}`,
            amount: Number(amount),
            currency: "PHP",

            description: `Billing for ${billing.property_name} - ${billing.unit_name}
Billing Period: ${formatBillingPeriod(billing.billing_period)}`,

            customer: {
                customer_id: xenditCustomerId, // ✅ real Xendit customer.id
            },

            metadata: {
                source: "upkyp_billing",
                billing_id: billing.billing_id,
                agreement_id: billing.agreement_id,
                billing_period: billing.billing_period,
                tenant_id,
            },

            items: [
                {
                    name: `MonthlyBilling – ${billing.unit_name}`,
                    quantity: 1,
                    price: Number(amount),
                    category: "rent",
                },
            ],

            success_redirect_url: redirectUrl.success,
            failure_redirect_url: redirectUrl.failure,
        };

        /* ---------------------------------------------------------------------- */
        /* Call Xendit                                                             */
        /* ---------------------------------------------------------------------- */
        const invoiceResp = await fetch("https://api.xendit.co/v2/invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " +
                    Buffer.from(`${secretKey}:`).toString("base64"),
            },
            body: JSON.stringify(invoicePayload),
        });

        const invoiceData = await invoiceResp.json();

        if (!invoiceResp.ok || invoiceData.error) {
            return httpError(
                500,
                "Failed to create Xendit invoice.",
                invoiceData
            );
        }

        return NextResponse.json(
            {
                message: "Xendit invoice created successfully.",
                checkoutUrl: invoiceData.invoice_url,
                invoiceId: invoiceData.id,
                agreement_id: billing.agreement_id,
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("Xendit invoice error:", err);
        return httpError(
            500,
            "Failed to initiate Xendit payment.",
            err.message || err
        );
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}
