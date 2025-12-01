import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const { agreement_id, payment_types, ref } = await req.json();

        if (!agreement_id || !payment_types || !ref) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        const typesArray = payment_types.split(",").map(t => t.trim());

        /* -------------------------------------------------------------------
           1) IDEMPOTENCY CHECK — Same ref already processed?
        ------------------------------------------------------------------- */
        const [existing]: any = await connection.query(
            `
            SELECT payment_id 
            FROM Payment 
            WHERE receipt_reference = ?
            LIMIT 1
            `,
            [ref]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                {
                    message: "Payment already processed (idempotent).",
                    agreement_id,
                    types: typesArray,
                    ref,
                },
                { status: 200 }
            );
        }

        /* -------------------------------------------------------------------
           2) BEGIN TRANSACTION
        ------------------------------------------------------------------- */
        await connection.beginTransaction();

        /* -------------------------------------------------------------------
           3) FETCH tenant_id once (needed for both tables)
        ------------------------------------------------------------------- */
        const [leaseRows]: any = await connection.query(
            `
            SELECT tenant_id
            FROM LeaseAgreement
            WHERE agreement_id = ?
            `,
            [agreement_id]
        );

        if (leaseRows.length === 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Agreement not found." },
                { status: 404 }
            );
        }

        const tenant_id = leaseRows[0].tenant_id;

        /* -------------------------------------------------------------------
           4) Get actual payable amounts from their own tables
        ------------------------------------------------------------------- */

        // Security Deposit
        const [depositRows]: any = await connection.query(
            `
            SELECT amount, status
            FROM SecurityDeposit
            WHERE lease_id = ? AND tenant_id = ?
            ORDER BY deposit_id DESC
            LIMIT 1
            `,
            [agreement_id, tenant_id]
        );

        // Advance Payment
        const [advanceRows]: any = await connection.query(
            `
            SELECT amount, status
            FROM AdvancePayment
            WHERE lease_id = ? AND tenant_id = ?
            ORDER BY advance_id DESC
            LIMIT 1
            `,
            [agreement_id, tenant_id]
        );

        /* -------------------------------------------------------------------
           5) Process each payment type separately (correct amounts)
        ------------------------------------------------------------------- */
        for (const type of typesArray) {
            let amount = 0;

            if (type === "security_deposit" && depositRows.length > 0) {
                amount = Number(depositRows[0].amount);
            }

            if (type === "advance_payment" && advanceRows.length > 0) {
                amount = Number(advanceRows[0].amount);
            }

            // Skip if no amount found or zero
            if (!amount || amount <= 0) continue;

            /* -------------------------------------------------
               INSERT Payment (bill_id = NULL, method = MAYA)
            ------------------------------------------------- */
            await connection.query(
                `
                INSERT INTO Payment (
                    bill_id,
                    agreement_id,
                    payment_type,
                    amount_paid,
                    payment_method_id,
                    payment_status,
                    receipt_reference,
                    proof_of_payment
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    null,              // bill_id, INITIAL doesn't belong to Billing
                    agreement_id,
                    type,
                    amount,
                    "MAYA",            // text, no more FK
                    "confirmed",
                    ref,
                    null,
                ]
            );

            /* -------------------------------------------------
               UPDATE SECURITY DEPOSIT TABLE
            ------------------------------------------------- */
            if (type === "security_deposit") {
                await connection.query(
                    `
                    UPDATE SecurityDeposit
                    SET status = 'paid', received_at = NOW()
                    WHERE lease_id = ? AND tenant_id = ?
                    `,
                    [agreement_id, tenant_id]
                );
            }

            /* -------------------------------------------------
               UPDATE ADVANCE PAYMENT TABLE
            ------------------------------------------------- */
            if (type === "advance_payment") {
                await connection.query(
                    `
                    UPDATE AdvancePayment
                    SET status = 'paid', received_at = NOW()
                    WHERE lease_id = ? AND tenant_id = ?
                    `,
                    [agreement_id, tenant_id]
                );
            }
        }

        /* -------------------------------------------------------------------
           6) COMMIT TRANSACTION
        ------------------------------------------------------------------- */
        await connection.commit();

        return NextResponse.json(
            {
                message: "Payment recorded successfully.",
                agreement_id,
                types: typesArray,
                ref,
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("❌ Transaction Error:", error);

        if (connection) await connection.rollback();

        return NextResponse.json(
            {
                error: "Failed to record payment.",
                details: error.message ?? String(error),
            },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
