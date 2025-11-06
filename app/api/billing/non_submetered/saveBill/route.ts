import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBillId } from "@/utils/id_generator";

/**
 * @route   POST /api/billing/non_submetered/saveBill
 * @desc    Creates or updates the current month's billing record for a given unit (non-submetered).
 *          - If a billing record exists for the unit this month, it updates it.
 *          - If none exists, it creates a new Billing record linked to its LeaseAgreement.
 *          - Generates a unique UPKYPBILLxxxxxx ID (auto-regenerates if duplicate).
 *          - Ensures atomicity & idempotence.
 * @usedBy  Landlord → Property → Billing → ReviewBillingPage
 *
 * @issues - due date is the next month. (should be still cruurent month).
 */

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();
    try {
        const { unit_id, agreement_id, total, additional_charges, discounts } = await req.json();

        console.log("🧾 Incoming Save Bill Payload:", { unit_id, agreement_id, total });

        if (!unit_id || !agreement_id || total === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connection.beginTransaction();

        // 1️⃣ Check if a billing already exists for this unit this month
        const [existing]: any = await connection.query(
            `
                SELECT billing_id
                FROM Billing
                WHERE unit_id = ?
                  AND MONTH(billing_period) = MONTH(CURDATE())
                  AND YEAR(billing_period) = YEAR(CURDATE())
                LIMIT 1
            `,
            [unit_id]
        );

        let billing_id: string;

        if (existing.length > 0) {
            // ✅ Update existing billing
            billing_id = existing[0].billing_id;
            await connection.query(
                `
                    UPDATE Billing
                    SET total_amount_due = ?, status = 'unpaid', updated_at = NOW()
                    WHERE billing_id = ?
                `,
                [total, billing_id]
            );
            console.log(`🟢 Updated existing billing ${billing_id}`);
        } else {
            // ⚙️ Generate a unique billing_id
            let unique = false;
            let newBillId = "";

            while (!unique) {
                newBillId = generateBillId();
                const [check]: any = await connection.query(
                    `SELECT billing_id FROM Billing WHERE billing_id = ? LIMIT 1`,
                    [newBillId]
                );

                if (check.length === 0) unique = true; // ✅ ID is unique, can use it
            }

            billing_id = newBillId;

            // 🆕 Insert new Billing record with foreign key lease_id
            await connection.query(
                `
                    INSERT INTO Billing (billing_id, unit_id, lease_id, billing_period, total_amount_due, due_date, status)
                    VALUES (?, ?, ?, CURDATE(), ?, DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'unpaid')
                `,
                [billing_id, unit_id, agreement_id, total]
            );

            console.log(`🆕 Created new billing record ${billing_id}`);
        }

        // 2️⃣ Remove previous additional charges (for idempotence)
        await connection.query(
            `DELETE FROM BillingAdditionalCharge WHERE billing_id = ?`,
            [billing_id]
        );

        // 3️⃣ Insert new "additional" and "discount" charges
        const combinedCharges = [
            ...(Array.isArray(additional_charges) ? additional_charges : []),
            ...(Array.isArray(discounts) ? discounts : []),
        ];

        for (const charge of combinedCharges) {
            if (!charge.type || isNaN(charge.amount)) continue;

            await connection.query(
                `
                    INSERT INTO BillingAdditionalCharge (billing_id, charge_category, charge_type, amount)
                    VALUES (?, ?, ?, ?)
                `,
                [
                    billing_id,
                    charge.category || "additional",
                    charge.type.trim(),
                    Number(charge.amount),
                ]
            );
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            billing_id,
            message:
                existing.length > 0
                    ? `Billing ${billing_id} updated successfully.`
                    : `Billing ${billing_id} created successfully.`,
        });
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("❌ Error saving non-submetered bill:", error);
        return NextResponse.json(
            {
                error: "Failed to save non-submetered bill.",
                details: error.sqlMessage || error.message,
            },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
