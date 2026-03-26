export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";

const {
    XENDIT_SECRET_KEY,
    XENDIT_TRANSBAL_KEY,
    XENDIT_MAIN_ACCOUNT_ID,
} = process.env;

/**
 * 🔐 Secure DB connection
 */
async function getDbConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
}

/**
 * 🔐 Fetch transaction (READ-ONLY)
 */
async function fetchTransactionDetails(transactionId: string) {
    const res = await fetch(
        `https://api.xendit.co/transactions?product_id=${transactionId}`,
        {
            method: "GET",
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
            },
        }
    );

    if (!res.ok) throw new Error("Failed to fetch transaction");

    const tx = await res.json();

    return {
        settlementStatus: tx.settlement_status || "PENDING",
        grossAmount: Number(tx.amount || 0),
        xenditFee: Number(tx.fee?.xendit_fee || 0),
        vat: Number(tx.fee?.value_added_tax || 0),
        withholdingTax: Number(tx.fee?.xendit_withholding_tax || 0),
        thirdParty: Number(tx.fee?.third_party_withholding_tax || 0),
    };
}

/**
 * 🔐 Transfer (IDEMPOTENT VIA REFERENCE)
 */
async function transferToSubaccount({
                                        amount,
                                        destinationUserId,
                                        reference,
                                    }: {
    amount: number;
    destinationUserId: string;
    reference: string;
}) {
    const res = await fetch("https://api.xendit.co/transfers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization:
                "Basic " +
                Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64"),
        },
        body: JSON.stringify({
            reference,
            amount,
            source_user_id: XENDIT_MAIN_ACCOUNT_ID,
            destination_user_id: destinationUserId,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(`Transfer failed`);
    }

    return data;
}

/**
 * 🔐 Generate deterministic idempotency key
 */
function generateLedgerKey(paymentId: number) {
    return crypto
        .createHash("sha256")
        .update(`ledger-payment-${paymentId}`)
        .digest("hex");
}

/**
 * ✅ MAIN API
 */
export async function POST(req: NextRequest) {
    let conn: mysql.Connection | null = null;

    try {
        const body = await req.json();
        const payment_id = Number(body?.payment_id);

        // 🔐 Strict validation
        if (!payment_id || isNaN(payment_id)) {
            return NextResponse.json(
                { message: "Invalid payment_id" },
                { status: 400 }
            );
        }

        conn = await getDbConnection();

        // 🔒 START TRANSACTION
        await conn.beginTransaction();

        /**
         * 🔒 LOCK PAYMENT ROW
         */
        const [paymentRows]: any = await conn.execute(
            `SELECT * FROM Payment WHERE payment_id = ? FOR UPDATE`,
            [payment_id]
        );

        if (paymentRows.length === 0) {
            throw new Error("Payment not found");
        }

        const payment = paymentRows[0];

        /**
         * 🔐 Validate state
         */
        if (payment.payment_status !== "confirmed") {
            throw new Error("Payment not confirmed");
        }

        if (!payment.gateway_transaction_ref) {
            throw new Error("Missing gateway reference");
        }

        /**
         * 🔐 Check if already transferred (idempotency)
         */
        if (payment.transfer_reference_id) {
            await conn.rollback();
            return NextResponse.json({
                message: "Already processed",
                idempotent: true,
            });
        }

        /**
         * 🔐 Fetch settlement
         */
        const tx = await fetchTransactionDetails(
            payment.gateway_transaction_ref
        );

        if (tx.settlementStatus !== "SETTLED") {
            throw new Error("Payment not settled");
        }

        /**
         * 🔐 Compute net
         */
        const totalFees =
            tx.xenditFee + tx.vat + tx.withholdingTax + tx.thirdParty;

        const netAmount = Math.max(tx.grossAmount - totalFees, 0);

        if (netAmount <= 0) {
            throw new Error("Invalid net amount");
        }

        /**
         * 🔗 Get landlord (SAFE JOIN)
         */
        const [landlordRows]: any = await conn.execute(
            `
            SELECT l.landlord_id, l.xendit_account_id
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            JOIN Landlord l ON p.landlord_id = l.landlord_id
            WHERE la.agreement_id = ?
            LIMIT 1
            `,
            [payment.agreement_id]
        );

        if (!landlordRows.length) {
            throw new Error("Landlord not found");
        }

        const landlord = landlordRows[0];

        if (!landlord.xendit_account_id) {
            throw new Error("Missing Xendit subaccount");
        }

        /**
         * 🔐 Transfer reference (idempotent)
         */
        const transferReference = `payment-${payment.payment_id}`;

        /**
         * 🚀 TRANSFER TO SUBACCOUNT
         */
        const transfer = await transferToSubaccount({
            amount: netAmount,
            destinationUserId: landlord.xendit_account_id,
            reference: transferReference,
        });

        /**
         * 🔐 UPDATE PAYMENT (atomic)
         */
        await conn.execute(
            `
            UPDATE Payment
            SET 
                transfer_reference_id = ?,
                gateway_settlement_status = 'settled',
                gateway_settled_at = NOW(),
                net_amount = ?
            WHERE payment_id = ?
            `,
            [transfer.id || transferReference, netAmount, payment.payment_id]
        );

        /**
         * 🔒 LOCK WALLET
         */
        const [walletRows]: any = await conn.execute(
            `
            SELECT lw.wallet_id, lw.available_balance
            FROM LandlordWallet lw
            WHERE lw.landlord_id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [landlord.landlord_id]
        );

        if (!walletRows.length) {
            throw new Error("Wallet not found");
        }

        const wallet = walletRows[0];

        const before = Number(wallet.available_balance);
        const after = before + netAmount;

        /**
         * 🔐 Ledger idempotency
         */
        const ledgerKey = generateLedgerKey(payment.payment_id);

        const [ledgerExists]: any = await conn.execute(
            `SELECT ledger_id FROM LandlordWalletLedger WHERE idempotency_key = ?`,
            [ledgerKey]
        );

        if (ledgerExists.length === 0) {
            /**
             * 💰 INSERT LEDGER
             */
            await conn.execute(
                `
                INSERT INTO LandlordWalletLedger
                (wallet_id, type, amount, balance_before, balance_after, reference_type, reference_id, idempotency_key)
                VALUES (?, 'credit', ?, ?, ?, 'payment', ?, ?)
                `,
                [
                    wallet.wallet_id,
                    netAmount,
                    before,
                    after,
                    payment.payment_id,
                    ledgerKey,
                ]
            );

            /**
             * 💰 UPDATE WALLET
             */
            await conn.execute(
                `UPDATE LandlordWallet SET available_balance = ? WHERE wallet_id = ?`,
                [after, wallet.wallet_id]
            );
        }

        /**
         * ✅ COMMIT
         */
        await conn.commit();

        return NextResponse.json({
            success: true,
            transferred: true,
            amount: netAmount,
            balance_after: after,
        });

    } catch (err: any) {
        if (conn) await conn.rollback();

        console.error("SECURE TRANSFER ERROR:", err);

        return NextResponse.json(
            { message: err.message || "Internal error" },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}