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
/* POST: Create Xendit Invoice                                                 */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
    let body: any;
    let conn: mysql.Connection | null = null;

    try {
        body = await req.json();
    } catch {
        return httpError(400, "Invalid JSON body.");
    }

    const {
        amount,
        billing_id,
        tenant_id,
        redirectUrl,
        firstName,
        lastName,
        emailAddress,
    } = body;

    /* ------------------------------------------------------------------------ */
    /* Validation                                                               */
    /* ------------------------------------------------------------------------ */
    if (!amount || !billing_id || !tenant_id) {
        return httpError(400, "Missing amount, billing_id, or tenant_id.");
    }

    if (!redirectUrl?.success || !redirectUrl?.failure) {
        return httpError(400, "Missing redirect URLs.");
    }

    const secretKey = process.env.XENDIT_SECRET_KEY;
    if (!secretKey) {
        return httpError(500, "Xendit secret key not configured.");
    }

    try {
        conn = await getDbConnection();

        /* ---------------------------------------------------------------------- */
        /* Fetch Billing Context                                                   */
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
        /* Get or Create Xendit Customer                                           */
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
        /* Build Redirect URLs (SERVER-SIDE)                                       */
        /* ---------------------------------------------------------------------- */
        const successRedirectUrl =
            `${redirectUrl.success}` +
            `?billing_id=${billing.billing_id}` +
            `&agreement_id=${billing.agreement_id}` +
            `&tenant_id=${tenant_id}` +
            `&amount=${Number(amount)}` +
            `&requestReferenceNumber=billing-${billing.billing_id}`;

        const failureRedirectUrl =
            `${redirectUrl.failure}` +
            `?billing_id=${billing.billing_id}` +
            `&agreement_id=${billing.agreement_id}`;

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
                customer_id: xenditCustomerId,
            },

            metadata: {
                source: "upkyp_billing",
                billing_id: billing.billing_id,
                agreement_id: billing.agreement_id,
                tenant_id,
                billing_period: billing.billing_period,
            },

            items: [
                {
                    name: `MonthlyBilling – ${billing.unit_name}`,
                    quantity: 1,
                    price: Number(amount),
                    category: "rent",
                },
            ],

            success_redirect_url: successRedirectUrl,
            failure_redirect_url: failureRedirectUrl,
        };

        /* ---------------------------------------------------------------------- */
        /* Create Invoice via Xendit                                               */
        /* ---------------------------------------------------------------------- */
        const invoiceResp = await fetch("https://api.xendit.co/v2/invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),
            },
            body: JSON.stringify(invoicePayload),
        });

        const invoiceData = await invoiceResp.json();

        if (!invoiceResp.ok || invoiceData.error) {
            return httpError(500, "Failed to create Xendit invoice.", invoiceData);
        }

        /* ---------------------------------------------------------------------- */
        /* Response                                                               */
        /* ---------------------------------------------------------------------- */
        return NextResponse.json(
            {
                message: "Xendit invoice created successfully.",
                checkoutUrl: invoiceData.invoice_url,
                invoiceId: invoiceData.id,
                billing_id: billing.billing_id,
                agreement_id: billing.agreement_id,
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("Xendit invoice creation error:", err);
        return httpError(500, "Failed to initiate Xendit payment.", err?.message);
    } finally {
        if (conn) {
            await conn.end().catch(() => {});
        }
    }
}
