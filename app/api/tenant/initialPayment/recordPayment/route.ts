import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const { agreement_id, payment_types, ref, totalAmount, status } =
            await req.json();

        /** ------------------------------------------------------------
         * Validate input
         * ------------------------------------------------------------ */
        if (!agreement_id || !payment_types || !ref || !status) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        const typesArray = payment_types.split(",").map((t: string) => t.trim());

        /** ------------------------------------------------------------
         * IDEMPOTENCY CHECK
         * Prevent ANY duplicate record using reference code
         * ------------------------------------------------------------ */
        const [existing]: any = await connection.query(
            `
            SELECT payment_id 
            FROM Payment 
            WHERE receipt_reference = ?
            LIMIT 1
            `,
            [ref] // parameterized
        );

        if (existing.length > 0) {
            return NextResponse.json(
                {
                    message: "Idempotent: payment already logged.",
                    agreement_id,
                    types: typesArray,
                    ref,
                },
                { status: 200 }
            );
        }

        /** ------------------------------------------------------------
         * Get tenant_id (needed for updates)
         * ------------------------------------------------------------ */
        const [leaseRows]: any = await connection.query(
            `
            SELECT tenant_id
            FROM LeaseAgreement
            WHERE agreement_id = ?
            `,
            [agreement_id]
        );

        if (leaseRows.length === 0) {
            return NextResponse.json(
                { error: "Agreement not found." },
                { status: 404 }
            );
        }

        const tenant_id = leaseRows[0].tenant_id;

        /** ------------------------------------------------------------
         * FAILED or CANCELLED
         * We still insert into Payment for history logs.
         * ------------------------------------------------------------ */
        if (status === "failed" || status === "cancelled") {
            await connection.beginTransaction();

            for (const type of typesArray) {
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
                        null,
                        agreement_id,
                        type,
                        totalAmount || 0,
                        "MAYA",
                        status, // cancelled | failed
                        ref,
                        null,
                    ]
                );
            }

            await connection.commit();

            return NextResponse.json(
                {
                    message: `Payment logged as ${status}.`,
                    agreement_id,
                    types: typesArray,
                    ref,
                },
                { status: 200 }
            );
        }

        /** ------------------------------------------------------------
         * SUCCESS PAYMENT — FULLY ATOMIC
         * ------------------------------------------------------------ */
        await connection.beginTransaction();

        // Fetch payable amounts
        const [depositRows]: any = await connection.query(
            `
            SELECT amount
            FROM SecurityDeposit
            WHERE lease_id = ? AND tenant_id = ?
            ORDER BY deposit_id DESC
            LIMIT 1
            `,
            [agreement_id, tenant_id]
        );

        const [advanceRows]: any = await connection.query(
            `
            SELECT amount
            FROM AdvancePayment
            WHERE lease_id = ? AND tenant_id = ?
            ORDER BY advance_id DESC
            LIMIT 1
            `,
            [agreement_id, tenant_id]
        );

        /** Process each payment type */
        for (const type of typesArray) {
            let amount = 0;

            if (type === "security_deposit" && depositRows.length > 0)
                amount = Number(depositRows[0].amount);

            if (type === "advance_payment" && advanceRows.length > 0)
                amount = Number(advanceRows[0].amount);

            /** Insert payment record */
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
                    null,
                    agreement_id,
                    type,
                    amount,
                    "MAYA",
                    "confirmed",
                    ref,
                    null,
                ]
            );

            /** Update payable tables */
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

        /** Commit transaction */
        await connection.commit();

        return NextResponse.json(
            {
                message: "Payment successfully recorded.",
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
                error: "Failed to process payment.",
                details: error.message,
            },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
