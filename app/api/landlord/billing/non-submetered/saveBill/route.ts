/**
 * @route   POST /api/billing/non_submetered/saveBill
 * @desc    Creates or updates the current month's billing record for a given unit (non-submetered).
 *          - If a billing record exists for the unit this month, it updates it.
 *          - If none exists, it creates a new Billing record linked to its LeaseAgreement.
 *          - Generates a unique UPKYPBILLxxxxxx ID (auto-regenerates if duplicate).
 *          - Ensures atomicity & idempotence.
 * @usedBy  Landlord → Property → Billing → ReviewBillingPage
 *
 * @notes
 * - billing_period = actual creation date (today)
 * - uniqueness enforced by MONTH + YEAR check
 * - due_date is within the SAME month
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBillId } from "@/utils/id_generator";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const {
            unit_id,
            agreement_id,
            total,
            additional_charges = [],
            discounts = [],
        } = await req.json();

        if (!unit_id || !agreement_id || total === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (isNaN(Number(total))) {
            return NextResponse.json(
                { error: "Invalid total amount" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();


        const [periodRow]: any = await connection.execute(
            `SELECT CURDATE() AS billing_period`
        );
        const billingPeriod = periodRow[0].billing_period;

        /* -------------------------------------------------
           2️⃣ Check existing bill (same MONTH + YEAR)
        ------------------------------------------------- */
        const [existing]: any = await connection.execute(
            `
        SELECT billing_id
        FROM Billing
        WHERE unit_id = ?
          AND MONTH(billing_period) = MONTH(CURDATE())
          AND YEAR(billing_period) = YEAR(CURDATE())
        FOR UPDATE
      `,
            [unit_id]
        );

        let billing_id: string;

        if (existing.length > 0) {
            /* -------------------------------------------------
               3️⃣ Update existing billing
            ------------------------------------------------- */
            billing_id = existing[0].billing_id;

            await connection.execute(
                `
          UPDATE Billing
          SET total_amount_due = ?,
              status = 'unpaid',
              updated_at = NOW()
          WHERE billing_id = ?
        `,
                [Number(total), billing_id]
            );
        } else {
            /* -------------------------------------------------
               4️⃣ Generate UNIQUE billing_id (collision-safe)
            ------------------------------------------------- */
            let isUnique = false;
            let attempts = 0;

            while (!isUnique) {
                if (attempts > 5) {
                    throw new Error("Failed to generate unique billing_id");
                }

                const candidate = generateBillId();

                const [check]: any = await connection.execute(
                    `
            SELECT billing_id
            FROM Billing
            WHERE billing_id = ?
            LIMIT 1
          `,
                    [candidate]
                );

                if (check.length === 0) {
                    billing_id = candidate;
                    isUnique = true;
                }

                attempts++;
            }

            /* -------------------------------------------------
               5️⃣ Insert new billing
               - due_date = LAST DAY OF CURRENT MONTH
            ------------------------------------------------- */
            await connection.execute(
                `
          INSERT INTO Billing (
            billing_id,
            unit_id,
            lease_id,
            billing_period,
            total_amount_due,
            due_date,
            status
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            LAST_DAY(?),
            'unpaid'
          )
        `,
                [
                    billing_id,
                    unit_id,
                    agreement_id,
                    billingPeriod,
                    Number(total),
                    billingPeriod,
                ]
            );
        }

        /* -------------------------------------------------
           6️⃣ Reset charges (idempotent)
           Ensures DB reflects latest payload exactly
        ------------------------------------------------- */
        await connection.execute(
            `
        DELETE FROM BillingAdditionalCharge
        WHERE billing_id = ?
      `,
            [billing_id]
        );

        /* -------------------------------------------------
           7️⃣ Insert additional charges & discounts
        ------------------------------------------------- */
        const allCharges = [
            ...(Array.isArray(additional_charges) ? additional_charges : []),
            ...(Array.isArray(discounts) ? discounts : []),
        ];

        for (const charge of allCharges) {
            if (
                !charge?.type ||
                charge.amount === undefined ||
                isNaN(Number(charge.amount))
            ) {
                continue;
            }

            await connection.execute(
                `
          INSERT INTO BillingAdditionalCharge (
            billing_id,
            charge_category,
            charge_type,
            amount
          )
          VALUES (?, ?, ?, ?)
        `,
                [
                    billing_id,
                    charge.category === "discount" ? "discount" : "additional",
                    charge.type.trim(),
                    Number(charge.amount),
                ]
            );
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            billing_id,
            message: existing.length
                ? "Billing updated successfully."
                : "Billing created successfully.",
        });
    } catch (error: any) {
        await connection.rollback();

        console.error("❌ Save Non-Submetered Billing Error:", error);

        return NextResponse.json(
            {
                error: "Failed to save non-submetered billing.",
                details: error.sqlMessage || error.message,
            },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
