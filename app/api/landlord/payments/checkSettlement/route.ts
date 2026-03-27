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
 * 🔐 Fetch transaction using bill_id as reference_id (matching webhook implementation)
 */
async function fetchTransactionByBillId(billId: string) {
    console.log("[XENDIT] Fetching transaction by reference_id:", billId);
    const referenceId = `billing-${billId}`;

    const res = await fetch(
        `https://api.xendit.co/transactions?product_id=${referenceId}`,
        {
            method: "GET",
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(`${XENDIT_TRANSBAL_KEY}:`).toString("base64"),
            },
        }
    );

    const text = await res.text();
    console.log("[XENDIT] Response status:", res.status);
    console.log("[XENDIT] Response text:", text.substring(0, 500));

    if (!res.ok) {
        throw new Error(`Failed to fetch transaction: ${res.status} - ${text}`);
    }

    if (!text) {
        throw new Error("Empty response from Xendit");
    }

    let tx;
    try {
        tx = JSON.parse(text);
    } catch (parseErr) {
        throw new Error(`Invalid JSON from Xendit: ${text.substring(0, 200)}`);
    }

    console.log("[XENDIT] Transaction data:", JSON.stringify(tx));

    // Handle array response - find the matching transaction
    const transactions = Array.isArray(tx) ? tx : (tx.data || []);
    const matchedTx = transactions.find((t: any) => t.reference_id === billId);

    if (!matchedTx) {
        throw new Error("Transaction not found for reference_id");
    }

    return {
        settlementStatus: matchedTx.settlement_status || "PENDING",
        grossAmount: Number(matchedTx.amount || 0),
        xenditFee: Number(matchedTx.fee?.xendit_fee || 0),
        vat: Number(matchedTx.fee?.value_added_tax || 0),
        withholdingTax: Number(matchedTx.fee?.xendit_withholding_tax || 0),
        thirdParty: Number(matchedTx.fee?.third_party_withholding_tax || 0),
        transactionId: matchedTx.id,
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
    console.log("[XENDIT] Transfer request:", { amount, destinationUserId, reference });
    
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

    const text = await res.text();
    console.log("[XENDIT] Transfer response status:", res.status);
    console.log("[XENDIT] Transfer response text:", text.substring(0, 500));
    
    if (!res.ok) {
        throw new Error(`Transfer failed: ${res.status} - ${text}`);
    }

    if (!text) {
        throw new Error("Empty response from Xendit transfer");
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (parseErr) {
        throw new Error(`Invalid JSON from Xendit transfer: ${text.substring(0, 200)}`);
    }

    return data;
}

/**
 * 🔐 Generate deterministic idempotency key
 */
function generateLedgerKey(paymentId: number, landlordId: string) {
    return crypto
        .createHash("sha256")
        .update(`ledger-${landlordId}-payment-${paymentId}`)
        .digest("hex");
}

/**
 * ✅ MAIN API
 */
export async function GET(req: NextRequest) {
    let conn: mysql.Connection | null = null;

    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");
        
        console.log("[STAGE 1] landlord_id:", landlord_id);

        if (!landlord_id) {
            return NextResponse.json(
                { message: "Missing landlord_id" },
                { status: 400 }
            );
        }

        console.log("[STAGE 2] Connecting to DB...");
        conn = await getDbConnection();
        console.log("[STAGE 2] DB connected");

        /**
         * 🔐 Get landlord details
         */
        console.log("[STAGE 3] Fetching landlord:", landlord_id);
        const [landlordRows]: any = await conn.execute(
            `SELECT * FROM Landlord WHERE landlord_id = ?`,
            [landlord_id]
        );
        console.log("[STAGE 3] Landlord rows:", landlordRows.length);

        if (landlordRows.length === 0) {
            throw new Error("Landlord not found");
        }

        const landlord = landlordRows[0];
        console.log("[STAGE 3] Landlord data:", JSON.stringify(landlord));

        if (!landlord.xendit_account_id) {
            throw new Error("Missing Xendit subaccount");
        }

        /**
         * 🔐 Get all payments for this landlord's confirmed payments that are not settled
         */
        console.log("[STAGE 4] Fetching payments for landlord...");
        const [billingRows]: any = await conn.execute(
            `
            SELECT p.payment_id, p.bill_id, p.amount_paid as payment_amount
            FROM Payment p
            JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property prop ON u.property_id = prop.property_id
            WHERE prop.landlord_id = ?
              AND p.payment_status = 'confirmed'
              AND (p.gateway_settlement_status IS NULL OR p.gateway_settlement_status != 'settled')
              AND p.bill_id IS NOT NULL
            `,
            [landlord_id]
        );
        console.log("[STAGE 4] Payments found:", billingRows.length);

        const results = [];
        let totalTransferred = 0;

        for (const billing of billingRows) {
            console.log("[STAGE 5] Processing payment_id:", billing.payment_id, "bill_id:", billing.bill_id);

            try {
                const payment_id = billing.payment_id;

                /**
                 * 🔐 Check if already transferred
                 */
                const [existingPayment]: any = await conn.execute(
                    `SELECT transfer_reference_id FROM Payment WHERE payment_id = ?`,
                    [payment_id]
                );
                
                if (existingPayment[0]?.transfer_reference_id) {
                    console.log("[STAGE 5] Already processed, skipping");
                    results.push({ payment_id, bill_id: billing.bill_id, status: "skipped", reason: "already_processed" });
                    continue;
                }

                /**
                 * 🔐 Fetch transaction from Xendit using reference_id (bill_id)
                 */
                const referenceId = `billing-${billing.bill_id}`;

                console.log("[STAGE 6] Checking Xendit for reference_id:", referenceId);

                const tx = await fetchTransactionByBillId(referenceId);
                console.log("[STAGE 6] Settlement status:", tx.settlementStatus, "transactionId:", tx.transactionId);

                if (tx.settlementStatus !== "SETTLED") {
                    console.log("[STAGE 6] Not settled yet, skipping");
                    results.push({ payment_id, bill_id: billing.bill_id, status: "skipped", reason: "not_settled" });
                    continue;
                }

                /**
                 * 🔐 Compute net amount
                 */
                const totalFees = tx.xenditFee + tx.vat + tx.withholdingTax + tx.thirdParty;
                const netAmount = Math.max(tx.grossAmount - totalFees, 0);
                console.log("[STAGE 7] Net amount:", netAmount);

                if (netAmount <= 0) {
                    results.push({ payment_id, bill_id: billing.bill_id, status: "skipped", reason: "invalid_amount" });
                    continue;
                }

                /**
                 * 🔐 Transfer to subaccount
                 */
                const transferReference = `payment-${payment_id}-${Date.now()}`;
                console.log("[STAGE 8] Initiating transfer...");
                
                const transfer = await transferToSubaccount({
                    amount: netAmount,
                    destinationUserId: landlord.xendit_account_id,
                    reference: transferReference,
                });
                console.log("[STAGE 8] Transfer complete:", JSON.stringify(transfer));

                /**
                 * 🔐 Update payment record
                 */
                console.log("[STAGE 9] Updating payment record...");
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
                    [transfer.id || transferReference, netAmount, payment_id]
                );

                /**
                 * 🔐 Get or create wallet
                 */
                console.log("[STAGE 10] Getting wallet for landlord...");
                let [walletRows]: any = await conn.execute(
                    `SELECT * FROM LandlordWallet WHERE landlord_id = ?`,
                    [landlord_id]
                );

                let wallet;
                if (walletRows.length === 0) {
                    const [newWallet]: any = await conn.execute(
                        `INSERT INTO LandlordWallet (landlord_id, available_balance) VALUES (?, 0)`,
                        [landlord_id]
                    );
                    wallet = { wallet_id: newWallet.insertId, available_balance: 0 };
                } else {
                    wallet = walletRows[0];
                }

                const before = Number(wallet.available_balance);
                const after = before + netAmount;

                /**
                 * 🔐 Insert ledger
                 */
                const ledgerKey = generateLedgerKey(payment_id, landlord_id);
                console.log("[STAGE 11] Inserting ledger:", ledgerKey);
                
                await conn.execute(
                    `
                    INSERT INTO LandlordWalletLedger
                    (wallet_id, type, amount, balance_before, balance_after, reference_type, reference_id, idempotency_key)
                    VALUES (?, 'credit', ?, ?, ?, 'payment', ?, ?)
                    `,
                    [wallet.wallet_id, netAmount, before, after, payment_id, ledgerKey]
                );

                await conn.execute(
                    `UPDATE LandlordWallet SET available_balance = ? WHERE wallet_id = ?`,
                    [after, wallet.wallet_id]
                );

                totalTransferred += netAmount;
                results.push({ 
                    payment_id, 
                    bill_id: billing.bill_id,
                    status: "success", 
                    amount: netAmount,
                    balance_after: after 
                });

            } catch (paymentErr: any) {
                console.error("[STAGE 5] Error processing billing:", paymentErr);
                results.push({ 
                    payment_id: billing.payment_id, 
                    bill_id: billing.bill_id,
                    status: "error", 
                    error: paymentErr.message 
                });
            }
        }

        console.log("[STAGE 12] All payments processed. Total transferred:", totalTransferred);

        return NextResponse.json({
            success: true,
            processed: results.length,
            successful: results.filter((r: any) => r.status === "success").length,
            total_transferred: totalTransferred,
            results,
        });

    } catch (err: any) {
        console.error("CHECK SETTLEMENT ERROR:", err);
        return NextResponse.json(
            { message: err.message || "Internal error" },
            { status: 500 }
        );
    } finally {
        if (conn) await conn.end();
    }
}
