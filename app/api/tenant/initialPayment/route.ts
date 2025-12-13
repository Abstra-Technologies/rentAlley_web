import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -----------------------------------------
   HELPERS
----------------------------------------- */
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

/* -----------------------------------------
   POST: INITIAL PAYMENT (XENDIT)
----------------------------------------- */
export async function POST(req: NextRequest) {
    let body: any;

    try {
        body = await req.json();
    } catch {
        return httpError(400, "Invalid JSON body.");
    }

    const {
        agreement_id,
        payment_type, // 'advance' | 'deposit'
        amount,
        payer,
        redirect_url,
    } = body;

    if (!agreement_id || !payment_type || !amount) {
        return httpError(400, "Missing agreement_id, payment_type, or amount.");
    }

    if (!redirect_url?.success || !redirect_url?.failure) {
        return httpError(400, "Missing redirect URLs.");
    }

    const secretKey = process.env.XENDIT_TEXT_SECRET_KEY;
    if (!secretKey) {
        return httpError(500, "Xendit TEST Secret Key not configured.");
    }

    let conn: mysql.Connection | undefined;

    try {
        conn = await getDbConnection();

        /* -----------------------------------------
           VALIDATE AGREEMENT
        ----------------------------------------- */
        const [rows]: any = await conn.execute(
            `
      SELECT 
        la.agreement_id,
        u.unit_name,
        p.property_name
      FROM LeaseAgreement la
        JOIN Unit u ON la.unit_id = u.unit_id
        JOIN Property p ON u.property_id = p.property_id
      WHERE la.agreement_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        if (!rows.length) {
            return httpError(404, "Lease agreement not found.");
        }

        const agreement = rows[0];

        /* -----------------------------------------
           CREATE XENDIT INVOICE
        ----------------------------------------- */
        const externalId = `init-${payment_type}-${agreement_id}-${Date.now()}`;

        const invoicePayload = {
            external_id: externalId,
            amount: Number(amount),
            currency: "PHP",
            description:
                payment_type === "deposit"
                    ? `Security Deposit for ${agreement.property_name} - ${agreement.unit_name}`
                    : `Advance Payment for ${agreement.property_name} - ${agreement.unit_name}`,
            success_redirect_url: `${redirect_url.success}?agreement_id=${agreement_id}&type=${payment_type}&amount=${amount}`,
            failure_redirect_url: `${redirect_url.failure}?agreement_id=${agreement_id}&type=${payment_type}&amount=${amount}`,
            customer: payer
                ? {
                    given_names: payer.first_name,
                    surname: payer.last_name,
                    email: payer.email,
                }
                : undefined,
        };

        const invoiceResp = await fetch(
            "https://api.xendit.co/v2/invoices",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        "Basic " +
                        Buffer.from(secretKey + ":").toString("base64"),
                },
                body: JSON.stringify(invoicePayload),
            }
        );

        const invoiceData = await invoiceResp.json();

        if (!invoiceResp.ok || invoiceData.error) {
            return httpError(
                500,
                "Failed to create Xendit invoice.",
                invoiceData
            );
        }

        /* -----------------------------------------
           RETURN CHECKOUT
        ----------------------------------------- */
        return NextResponse.json(
            {
                message: "Xendit invoice created for initial payment.",
                checkout_url: invoiceData.invoice_url,
                invoice_id: invoiceData.id,
                external_id: externalId,
                agreement_id,
                payment_type,
                raw_gateway_payload: invoiceData,
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("Xendit Initial Payment Error:", err);
        return httpError(
            500,
            "Failed to initiate Xendit initial payment.",
            err.message || err
        );
    } finally {
        if (conn) await conn.end().catch(() => {});
    }
}
