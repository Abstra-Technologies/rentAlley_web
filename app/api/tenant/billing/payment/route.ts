// production code

// import { NextRequest, NextResponse } from "next/server";
// import mysql from "mysql2/promise";
//
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
//
// // Helpers --------------------------------------------------------------------
// function httpError(status: number, message: string, extra?: any) {
//     return NextResponse.json({ error: message, ...(extra ? { details: extra } : {}) }, { status });
// }
//
// async function getDbConnection() {
//     const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
//     return mysql.createConnection({
//         host: DB_HOST,
//         user: DB_USER,
//         password: DB_PASSWORD,
//         database: DB_NAME,
//     });
// }
//
// // POST -----------------------------------------------------------------------
// export async function POST(req: NextRequest) {
//     let body: any;
//     try {
//         body = await req.json();
//     } catch {
//         return httpError(400, "Invalid JSON body.");
//     }
//
//     const { amount, billing_id, tenant_id, payment_method_id = 7, redirectUrl } = body;
//
//     if (!amount || !billing_id || !tenant_id)
//         return httpError(400, "Missing amount, billing_id, or tenant_id.");
//
//     if (!redirectUrl?.success || !redirectUrl?.failure || !redirectUrl?.cancel)
//         return httpError(400, "Missing redirect URLs (success, failure, cancel).");
//
//     // Xendit keys
//     const secretKey = process.env.XENDIT_SECRET_KEY;
//     if (!secretKey) return httpError(500, "Xendit Secret Key not configured.");
//
//     let conn: mysql.Connection | undefined;
//
//     try {
//         conn = await getDbConnection();
//
//         // Fetch leasing details for the invoice description
//         const [billingRows] = await conn.execute(
//             `
//             SELECT
//                 lease_id AS agreement_id,
//                 b.total_amount_due,
//                 u.unit_name,
//                 p.property_name
//             FROM Billing b
//             JOIN Unit u ON b.unit_id = u.unit_id
//             JOIN Property p ON u.property_id = p.property_id
//             WHERE b.billing_id = ?
//             LIMIT 1
//         `,
//             [billing_id]
//         );
//
//         if (!billingRows.length) return httpError(404, "Billing not found.");
//         const billing = billingRows[0];
//         const agreement_id = billing.agreement_id;
//
//         // Create unique reference
//         const reference = `UPKYP-${agreement_id}-${Date.now()}`;
//
//         // Insert pending Payment
//         await conn.execute(
//             `
//             INSERT INTO Payment (
//                 agreement_id,
//                 payment_type,
//                 amount_paid,
//                 payment_method_id,
//                 payment_status,
//                 receipt_reference
//             )
//             VALUES (?, 'billing', ?, ?, 'pending', ?)
//         `,
//             [agreement_id, amount, payment_method_id, reference]
//         );
//
//         // Create Xendit Invoice
//         const invoicePayload = {
//             external_id: `billing-${billing_id}`,
//             amount: Number(amount),
//             currency: "PHP",
//             description: `Billing for ${billing.property_name} - ${billing.unit_name}`,
//             customer: {
//                 customer_id: `tenant-${tenant_id}`,
//             },
//             success_redirect_url: `${redirectUrl.success}?billing_id=${billing_id}&tenant_id=${tenant_id}&agreement_id=${agreement_id}&amount=${amount}`,
//             failure_redirect_url: `${redirectUrl.failure}?billing_id=${billing_id}&tenant_id=${tenant_id}&agreement_id=${agreement_id}&amount=${amount}`,
//         };
//
//         const invoiceResp = await fetch("https://api.xendit.co/v2/invoices", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: "Basic " + Buffer.from(secretKey + ":").toString("base64"),
//             },
//             body: JSON.stringify(invoicePayload),
//         });
//
//         const invoiceData = await invoiceResp.json();
//
//         if (invoiceData.error) {
//             return httpError(500, "Failed to create Xendit invoice", invoiceData);
//         }
//
//         const invoiceUrl = invoiceData.invoice_url;
//
//         return NextResponse.json(
//             {
//                 message: "Xendit invoice created successfully.",
//                 checkoutUrl: invoiceUrl, // front-end expects checkoutUrl
//                 invoiceId: invoiceData.id,
//                 reference,
//                 agreement_id,
//                 raw_gateway_payload: invoiceData,
//             },
//             { status: 200 }
//         );
//     } catch (err: any) {
//         return httpError(500, "Failed to initiate Xendit payment.", err.message || err);
//     } finally {
//         if (conn) await conn.end().catch(() => {});
//     }
// }


//test dev

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helpers --------------------------------------------------------------------
function httpError(status: number, message: string, extra?: any) {
    return NextResponse.json({ error: message, ...(extra ? { details: extra } : {}) }, { status });
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

// POST -----------------------------------------------------------------------
export async function POST(req: NextRequest) {
    let body: any;
    try {
        body = await req.json();
    } catch {
        return httpError(400, "Invalid JSON body.");
    }

    const { amount, billing_id, tenant_id, redirectUrl } = body;

    if (!amount || !billing_id || !tenant_id)
        return httpError(400, "Missing amount, billing_id, or tenant_id.");

    if (!redirectUrl?.success || !redirectUrl?.failure || !redirectUrl?.cancel)
        return httpError(400, "Missing redirect URLs (success, failure, cancel).");

    const secretKey = process.env.XENDIT_TEXT_SECRET_KEY;
    if (!secretKey) return httpError(500, "Xendit TEST Secret Key not configured.");

    let conn: mysql.Connection | undefined;

    try {
        conn = await getDbConnection();

        // Fetch billing and related info
        const [billingRows] = await conn.execute(
            `
            SELECT
                lease_id AS agreement_id,
                b.total_amount_due,
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

        if (!billingRows.length) return httpError(404, "Billing not found.");
        const billing = billingRows[0];
        const agreement_id = billing.agreement_id;

        // Create unique reference
        const reference = `UPKYP-${agreement_id}-${Date.now()}`;

        // --- Skip payment insert, rely on webhook ---

        const invoicePayload = {
            external_id: `billing-${billing_id}`,
            amount: Number(amount),
            currency: "PHP",
            description: `Billing for ${billing.property_name} - ${billing.unit_name}`,
            customer: { customer_id: `tenant-${tenant_id}` },
            success_redirect_url: `${redirectUrl.success}?billing_id=${billing_id}&tenant_id=${tenant_id}&agreement_id=${agreement_id}&amount=${amount}`,
            failure_redirect_url: `${redirectUrl.failure}?billing_id=${billing_id}&tenant_id=${tenant_id}&agreement_id=${agreement_id}&amount=${amount}`,
        };

        const invoiceResp = await fetch("https://api.xendit.co/v2/invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + Buffer.from(secretKey + ":").toString("base64"),
            },
            body: JSON.stringify(invoicePayload),
        });

        const invoiceData = await invoiceResp.json();

        if (invoiceData.error) {
            return httpError(500, "Failed to create Xendit invoice", invoiceData);
        }

        return NextResponse.json({
            message: "Xendit TEST invoice created successfully.",
            checkoutUrl: invoiceData.invoice_url,
            invoiceId: invoiceData.id,
            reference,
            agreement_id,
            raw_gateway_payload: invoiceData,
        }, { status: 200 });

    } catch (err: any) {
        return httpError(500, "Failed to initiate Xendit TEST payment.", err.message || err);
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}
