import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import axios from "axios";
import { encryptData } from "@/crypto/encrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helpers --------------------------------------------------------------------
function httpError(status: number, message: string, extra?: any) {
    return NextResponse.json({ error: message, ...(extra ? { details: extra } : {}) }, { status });
}

function sanitizeNumber(n: unknown): number | null {
    if (typeof n === "number" && !Number.isNaN(n)) return n;
    if (typeof n === "string" && n.trim() !== "" && !Number.isNaN(Number(n))) return Number(n);
    return null;
}

async function getDbConnection() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    if (!DB_HOST || !DB_USER || !DB_NAME)
        throw new Error("Database environment variables are not fully configured.");
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

    const {
        amount,
        billing_id,
        tenant_id,
        payment_method_id = 7,
        redirectUrl,
    } = body;

    console.log(body);

    if (!amount || !billing_id || !tenant_id)
        return httpError(400, "Missing amount, billing_id, or tenant_id.");

    if (!redirectUrl?.success || !redirectUrl?.failure || !redirectUrl?.cancel)
        return httpError(400, "Missing redirect URLs (success, failure, cancel).");

    // 🔹 Maya credentials
    const publicKey = process.env.MAYA_PUBLIC_KEY;
    const secretKey = process.env.MAYA_SECRET_KEY;
    if (!publicKey || !secretKey)
        return httpError(500, "Maya keys not configured in environment variables.");

    let connection: mysql.Connection | undefined;

    try {
        connection = await getDbConnection();

        // 🔹 Fetch agreement_id using billing_id
        const [billingRows] = await connection.execute<mysql.RowDataPacket[]>(
            `
                SELECT lease_id AS agreement_id,
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
        const reference = `UPKYP-${agreement_id}-${Date.now()}`;

        // 🔹 Record pending payment
        await connection.execute(
            `
                INSERT INTO Payment (
                    agreement_id,
                    payment_type,
                    amount_paid,
                    payment_method_id,
                    payment_status,
                    receipt_reference
                )
                VALUES (?, 'billing', ?, ?, 'pending', ?)
            `,
            [agreement_id, amount, payment_method_id, reference]
        );

        // 🔹 Build Maya checkout payload
        const mayaPayload = {
            totalAmount: { value: Number(amount), currency: "PHP" },
            requestReferenceNumber: reference,
            buyer: {
                firstName: "Tenant",
                lastName: "User",
                contact: { email: "tenant@example.com" },
            },
            redirectUrl: {
                success: `${redirectUrl.success}?amount=${encodeURIComponent(amount)}&requestReferenceNumber=${encodeURIComponent(reference)}&tenant_id=${encodeURIComponent(tenant_id)}&billing_id=${encodeURIComponent(billing_id)}&agreement_id=${encodeURIComponent(agreement_id)}`,
                failure: `${redirectUrl.failure}?amount=${encodeURIComponent(amount)}&requestReferenceNumber=${encodeURIComponent(reference)}&tenant_id=${encodeURIComponent(tenant_id)}&billing_id=${encodeURIComponent(billing_id)}&agreement_id=${encodeURIComponent(agreement_id)}`,
                cancel: `${redirectUrl.cancel}?amount=${encodeURIComponent(amount)}&requestReferenceNumber=${encodeURIComponent(reference)}&tenant_id=${encodeURIComponent(tenant_id)}&billing_id=${encodeURIComponent(billing_id)}&agreement_id=${encodeURIComponent(agreement_id)}`,
            },
            items: [
                {
                    name: `Monthly Rent Billing for ${billing.property_name} - ${billing.unit_name}`,
                    quantity: 1,
                    totalAmount: { value: Number(amount), currency: "PHP" },
                },
            ],
        };


        const mayaAuth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");

        // 🔹 Call Maya API
        const mayaResp = await axios.post(
            "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
            mayaPayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${mayaAuth}`,
                },
            }
        );
        const raw_gateway_payload = mayaResp.data;

        const checkoutUrl = mayaResp.data.redirectUrl;
        const checkoutId = mayaResp.data.checkoutId;

        await connection.end();

        return NextResponse.json(
            {
                message: "Checkout session created successfully.",
                checkoutUrl,
                checkoutId,
                reference,
                agreement_id,
                raw_gateway_payload
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("❌ Maya billing payment error:", err.response?.data || err.message);
        if (connection) {
            try {
                await connection.end();
            } catch {}
        }
        return httpError(500, "Failed to initiate payment.", err.response?.data || err.message);
    }finally {
        if (connection) await connection.end().catch(() => {});
    }
}
