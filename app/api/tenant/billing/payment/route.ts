// /* -------------------------------------------------------------------------- */
// /* PAYMENT GATEWAY INITIALIZATION ON XENDIT                                                      */
// /* -------------------------------------------------------------------------- */
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
//
// /* -------------------------------------------------------------------------- */
// /* Imports                                                                    */
// /* -------------------------------------------------------------------------- */
// import { NextRequest, NextResponse } from "next/server";
// import mysql from "mysql2/promise";
// import crypto from "crypto";
// import { createXenditCustomer } from "@/lib/payments/xenditCustomer";
//
// /* -------------------------------------------------------------------------- */
// /* Environment Variables                                                      */
// /* -------------------------------------------------------------------------- */
// const {
//     DB_HOST,
//     DB_USER,
//     DB_PASSWORD,
//     DB_NAME,
//     XENDIT_SECRET_KEY,
//     XENDIT_TEXT_SECRET_KEY
// } = process.env;
//
// /* -------------------------------------------------------------------------- */
// /* Xendit Constants                                                           */
// /* -------------------------------------------------------------------------- */
// const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";
// const CURRENCY = "PHP";
// const MAX_RETRIES = 3;
// const BASE_RETRY_DELAY = 500;
//
// /* -------------------------------------------------------------------------- */
// /* Utility Helpers                                                            */
// /* -------------------------------------------------------------------------- */
//
// function httpError(status: number, message: string, extra?: any) {
//     return NextResponse.json(
//         { error: message, ...(extra ? { details: extra } : {}) },
//         { status }
//     );
// }
//
// function formatBillingPeriod(date: string | Date) {
//     return new Date(date).toLocaleDateString("en-US", {
//         month: "long",
//         year: "numeric",
//     });
// }
//
// async function getDbConnection() {
//     if (!DB_HOST || !DB_USER || !DB_NAME) {
//         throw new Error("Database environment variables not configured.");
//     }
//
//     return mysql.createConnection({
//         host: DB_HOST,
//         user: DB_USER,
//         password: DB_PASSWORD,
//         database: DB_NAME,
//     });
// }
//
// /* -------------------------------------------------------------------------- */
// /* Gateway Logger                                                             */
// /* -------------------------------------------------------------------------- */
//
// async function logGatewayEvent(event: {
//     type: "request" | "response" | "rate_limit" | "error";
//     endpoint: string;
//     payload?: any;
//     response?: any;
//     statusCode?: number;
// }) {
//     console.log(
//         `[XENDIT][${event.type.toUpperCase()}]`,
//         JSON.stringify(event, null, 2)
//     );
// }
//
// /* -------------------------------------------------------------------------- */
// /* Fetch With Retry (Rate-Limit Safe)                                         */
// /* -------------------------------------------------------------------------- */
//
// async function fetchWithRetry(
//     url: string,
//     options: RequestInit,
//     maxRetries = MAX_RETRIES
// ) {
//     let attempt = 0;
//
//     while (true) {
//         const response = await fetch(url, options);
//
//         if (response.ok) return response;
//
//         if (response.status === 429 && attempt < maxRetries) {
//             attempt++;
//
//             const retryAfter = response.headers.get("retry-after");
//             const delayMs = retryAfter
//                 ? Number(retryAfter) * 1000
//                 : BASE_RETRY_DELAY * Math.pow(2, attempt);
//
//             await logGatewayEvent({
//                 type: "rate_limit",
//                 endpoint: url,
//                 statusCode: 429,
//                 response: { retryAfter, attempt },
//             });
//
//             await new Promise((res) => setTimeout(res, delayMs));
//             continue;
//         }
//
//         return response;
//     }
// }
//
// /* -------------------------------------------------------------------------- */
// /* POST: Create Xendit Invoice                                                */
// /* -------------------------------------------------------------------------- */
//
// export async function POST(req: NextRequest) {
//     let conn: mysql.Connection | null = null;
//
//     try {
//         /* ---------------------------------------------------------------------- */
//         /* Parse Body                                                             */
//         /* ---------------------------------------------------------------------- */
//         let body: any;
//
//         try {
//             body = await req.json();
//         } catch {
//             return httpError(400, "Invalid JSON body.");
//         }
//
//         const {
//             amount,
//             billing_id,
//             tenant_id,
//             redirectUrl,
//             firstName,
//             lastName,
//             emailAddress,
//         } = body;
//
//         /* ---------------------------------------------------------------------- */
//         /* Validation                                                             */
//         /* ---------------------------------------------------------------------- */
//
//         if (!amount || !billing_id || !tenant_id) {
//             return httpError(400, "Missing required fields.");
//         }
//
//         if (!redirectUrl?.success || !redirectUrl?.failure) {
//             return httpError(400, "Missing redirect URLs.");
//         }
//
//         if (!XENDIT_SECRET_KEY) {
//             return httpError(500, "Xendit secret key not configured.");
//         }
//
//         /* ---------------------------------------------------------------------- */
//         /* Database Connection                                                    */
//         /* ---------------------------------------------------------------------- */
//
//         conn = await getDbConnection();
//
//         /* ---------------------------------------------------------------------- */
//         /* Fetch Billing Context                                                  */
//         /* ---------------------------------------------------------------------- */
//
//         const [billingRows]: any = await conn.execute(
//             `
//       SELECT
//         b.billing_id,
//         b.lease_id AS agreement_id,
//         b.billing_period,
//         u.unit_name,
//         p.property_name
//       FROM Billing b
//       JOIN Unit u ON b.unit_id = u.unit_id
//       JOIN Property p ON u.property_id = p.property_id
//       WHERE b.billing_id = ?
//       LIMIT 1
//       `,
//             [billing_id]
//         );
//
//         if (!billingRows.length) {
//             return httpError(404, "Billing not found.");
//         }
//
//         const billing = billingRows[0];
//
//         /* ---------------------------------------------------------------------- */
//         /* Fetch or Create Xendit Customer                                        */
//         /* ---------------------------------------------------------------------- */
//
//         const [tenantRows]: any = await conn.execute(
//             `SELECT xendit_customer_id FROM Tenant WHERE tenant_id = ? LIMIT 1`,
//             [tenant_id]
//         );
//
//         let xenditCustomerId = tenantRows?.[0]?.xendit_customer_id ?? null;
//
//         if (!xenditCustomerId) {
//             xenditCustomerId = await createXenditCustomer({
//                 referenceId: `tenant-${tenant_id}`,
//                 firstName,
//                 lastName,
//                 email: emailAddress,
//                 secretKey: XENDIT_SECRET_KEY,
//
//             });
//
//             await conn.execute(
//                 `UPDATE Tenant SET xendit_customer_id = ? WHERE tenant_id = ?`,
//                 [xenditCustomerId, tenant_id]
//             );
//         }
//
//         /* ---------------------------------------------------------------------- */
//         /* Idempotency Key                                                        */
//         /* ---------------------------------------------------------------------- */
//
//         const idempotencyKey = crypto
//             .createHash("sha256")
//             .update(`billing-${billing.billing_id}`)
//             .digest("hex");
//
//         /* ---------------------------------------------------------------------- */
//         /* Redirect URLs                                                          */
//         /* ---------------------------------------------------------------------- */
//
//         const successRedirectUrl =
//             `${redirectUrl.success}` +
//             `?billing_id=${billing.billing_id}` +
//             `&agreement_id=${billing.agreement_id}` +
//             `&tenant_id=${tenant_id}` +
//             `&amount=${Number(amount)}`;
//
//         const failureRedirectUrl =
//             `${redirectUrl.failure}` +
//             `?billing_id=${billing.billing_id}` +
//             `&agreement_id=${billing.agreement_id}`;
//
//         /* ---------------------------------------------------------------------- */
//         /* Invoice Payload                                                        */
//         /* ---------------------------------------------------------------------- */
//
//         const invoicePayload = {
//             external_id: `billing-${billing.billing_id}`,
//             amount: Number(amount),
//             currency: CURRENCY,
//             description: `Billing for ${billing.property_name} - ${billing.unit_name}
// Billing Period: ${formatBillingPeriod(billing.billing_period)}`,
//             customer: {
//                 customer_id: xenditCustomerId,
//             },
//             metadata: {
//                 billing_id: billing.billing_id,
//                 agreement_id: billing.agreement_id,
//                 tenant_id,
//             },
//             items: [
//                 {
//                     name: `Monthly Billing – ${billing.unit_name}`,
//                     quantity: 1,
//                     price: Number(amount),
//                 },
//             ],
//             success_redirect_url: successRedirectUrl,
//             failure_redirect_url: failureRedirectUrl,
//         };
//
//         /* ---------------------------------------------------------------------- */
//         /* Create Invoice via Xendit                                              */
//         /* ---------------------------------------------------------------------- */
//
//         await logGatewayEvent({
//             type: "request",
//             endpoint: XENDIT_API_URL,
//             payload: invoicePayload,
//         });
//
//         const invoiceResp = await fetchWithRetry(XENDIT_API_URL, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization:
//                     "Basic " +
//                     Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64"),
//                 "Idempotency-Key": idempotencyKey,
//             },
//             body: JSON.stringify(invoicePayload),
//         });
//
//         const invoiceData = await invoiceResp.json();
//
//         if (!invoiceResp.ok) {
//             await logGatewayEvent({
//                 type: "error",
//                 endpoint: XENDIT_API_URL,
//                 statusCode: invoiceResp.status,
//                 response: invoiceData,
//             });
//
//             if (invoiceResp.status === 429) {
//                 return httpError(
//                     503,
//                     "Payment service is temporarily busy. Please try again shortly."
//                 );
//             }
//
//             return httpError(
//                 500,
//                 "Failed to create Xendit invoice.",
//                 invoiceData
//             );
//         }
//
//         await logGatewayEvent({
//             type: "response",
//             endpoint: XENDIT_API_URL,
//             response: invoiceData,
//             statusCode: 200,
//         });
//
//         /* ---------------------------------------------------------------------- */
//         /* Success Response                                                       */
//         /* ---------------------------------------------------------------------- */
//
//         return NextResponse.json(
//             {
//                 message: "Xendit invoice created successfully.",
//                 checkoutUrl: invoiceData.invoice_url,
//                 invoiceId: invoiceData.id,
//                 billing_id: billing.billing_id,
//                 agreement_id: billing.agreement_id,
//             },
//             { status: 200 }
//         );
//
//     } catch (err: any) {
//         await logGatewayEvent({
//             type: "error",
//             endpoint: "create-invoice",
//             response: err?.message,
//         });
//
//         return httpError(500, "Failed to initiate Xendit payment.", err?.message);
//     } finally {
//         if (conn) await conn.end().catch(() => {});
//     }
// }


/* -------------------------------------------------------------------------- */
/* PAYMENT GATEWAY INITIALIZATION ON XENDIT (INVOICE V2 + SPLIT RULE)       */
/* -------------------------------------------------------------------------- */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";
import { createXenditCustomer } from "@/lib/payments/xenditCustomer";

/* -------------------------------------------------------------------------- */
/* Environment Variables                                                      */
/* -------------------------------------------------------------------------- */

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    XENDIT_SECRET_KEY,
    XENDIT_TEXT_SECRET_KEY
} = process.env;

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const XENDIT_API_URL = "https://api.xendit.co/v2/invoices";
const CURRENCY = "PHP";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function httpError(status: number, message: string, extra?: any) {
    return NextResponse.json(
        { error: message, ...(extra ? { details: extra } : {}) },
        { status }
    );
}

function formatBillingPeriod(date: string | Date) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
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
/* POST: Create Invoice (Hosted Checkout + Split Rule)                       */
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

        console.log('body: ', body);

        /* --------------------------- VALIDATION --------------------------- */

        if (!amount || !billing_id || !tenant_id) {
            return httpError(400, "Missing required fields.");
        }

        if (!redirectUrl?.success || !redirectUrl?.failure) {
            return httpError(400, "Missing redirect URLs.");
        }


        conn = await getDbConnection();

        /* ---------------- FETCH BILLING + SUBACCOUNT + PLAN --------------- */

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
            return httpError(404, "Billing not found.");
        }

        const billing = rows[0];

        if (!billing.xendit_account_id) {
            return httpError(400, "Landlord subaccount not configured.");
        }

        if (!billing.is_active) {
            return httpError(400, "Landlord has no active subscription.");
        }

        if (!billing.split_rule_id) {
            return httpError(400, "Split rule not configured for plan.");
        }

        /* ---------------- FETCH / CREATE XENDIT CUSTOMER ------------------ */

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

        /* --------------------------- IDEMPOTENCY --------------------------- */

        const idempotencyKey = crypto
            .createHash("sha256")
            .update(`billing-${billing.billing_id}`)
            .digest("hex");

        /* ------------------------- REDIRECT URLs --------------------------- */

        const successRedirectUrl =
            `${redirectUrl.success}?billing_id=${billing.billing_id}`;

        const failureRedirectUrl =
            `${redirectUrl.failure}?billing_id=${billing.billing_id}`;

        /* ------------------------- INVOICE PAYLOAD ------------------------- */

        const invoicePayload = {
            external_id: `billing-${billing.billing_id}`,
            amount: Number(amount),
            currency: CURRENCY,
            description: `Billing for ${billing.property_name} - ${billing.unit_name}
Billing Period: ${formatBillingPeriod(billing.billing_period)}`,
            customer: {
                customer_id: xenditCustomerId,
            },
            metadata: {
                billing_id: billing.billing_id,
                agreement_id: billing.agreement_id,
                tenant_id,
                landlord_id: billing.landlord_id,
                plan_code: billing.plan_code,
            },
            items: [
                {
                    name: `Monthly Billing – ${billing.unit_name}`,
                    quantity: 1,
                    price: Number(amount),
                },
            ],
            success_redirect_url: successRedirectUrl,
            failure_redirect_url: failureRedirectUrl,
        };

        /* ------------------------- CALL XENDIT ----------------------------- */

        const invoiceResp = await fetch(XENDIT_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Basic " +
                    Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64"),

                // 🔥 xenPlatform headers
                "for-user-id": billing.xendit_account_id,
                "with-split-rule": billing.split_rule_id,

                "Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify(invoicePayload),
        });

        const invoiceData = await invoiceResp.json();

        if (!invoiceResp.ok) {
            return httpError(
                500,
                "Failed to create Xendit invoice.",
                invoiceData
            );
        }

        /* --------------------------- SUCCESS ------------------------------- */

        return NextResponse.json(
            {
                success: true,
                checkoutUrl: invoiceData.invoice_url,
                invoiceId: invoiceData.id,
                billing_id: billing.billing_id,
                agreement_id: billing.agreement_id,
            },
            { status: 200 }
        );

    } catch (err: any) {
        return httpError(500, "Payment initialization failed.", err.message);
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}
