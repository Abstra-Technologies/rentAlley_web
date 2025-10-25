import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBillId } from "@/utils/id_generator";

/**
 * Shared logic for creating or updating a billing record
 */
async function upsertBilling(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const {
            unit_id,
            readingDate,
            dueDate,
            waterPrevReading,
            waterCurrentReading,
            electricityPrevReading,
            electricityCurrentReading,
            totalWaterAmount,
            totalElectricityAmount,
            total_amount_due,
            additionalCharges = [],
        } = await req.json();

        if (!unit_id || !readingDate || !dueDate) {
            return NextResponse.json(
                { error: "Missing required fields (unit_id, readingDate, dueDate)" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // 1️⃣ Find active or completed lease for this unit
        const [lease]: any = await connection.query(
            `
                SELECT agreement_id
                FROM LeaseAgreement
                WHERE unit_id = ? AND status IN ('active', 'completed')
                LIMIT 1
            `,
            [unit_id]
        );

        if (!lease.length) {
            await connection.rollback();
            return NextResponse.json(
                { error: "No active or completed lease found for this unit." },
                { status: 404 }
            );
        }

        const lease_id = lease[0].agreement_id;

        // 2️⃣ Check if a billing record already exists this month
        const [existing]: any = await connection.query(
            `
                SELECT billing_id
                FROM Billing
                WHERE unit_id = ?
                  AND MONTH(billing_period) = MONTH(?)
                  AND YEAR(billing_period) = YEAR(?)
                LIMIT 1
            `,
            [unit_id, readingDate, readingDate]
        );

        let billing_id;
        const isUpdate = existing.length > 0;

        if (isUpdate) {
            // ✅ UPDATE existing billing
            billing_id = existing[0].billing_id;
            await connection.query(
                `
                    UPDATE Billing
                    SET total_water_amount = ?,
                        total_electricity_amount = ?,
                        total_amount_due = ?,
                        due_date = ?,
                        status = 'unpaid',
                        updated_at = NOW()
                    WHERE billing_id = ?
                `,
                [
                    totalWaterAmount || 0,
                    totalElectricityAmount || 0,
                    total_amount_due || 0,
                    dueDate,
                    billing_id,
                ]
            );
        } else {
            // ✅ Generate new billing_id (VARCHAR)
            let newBillingId = generateBillId();
            let [check]: any = await connection.query(
                "SELECT billing_id FROM Billing WHERE billing_id = ? LIMIT 1",
                [newBillingId]
            );
            while (check.length > 0) {
                newBillingId = generateBillId();
                [check] = await connection.query(
                    "SELECT billing_id FROM Billing WHERE billing_id = ? LIMIT 1",
                    [newBillingId]
                );
            }

            billing_id = newBillingId;

            await connection.query(
                `
            INSERT INTO Billing (
                billing_id, lease_id, unit_id, billing_period,
                total_water_amount, total_electricity_amount,
                total_amount_due, due_date, status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', NOW())
        `,
                [
                    billing_id,
                    lease_id,
                    unit_id,
                    readingDate,
                    totalWaterAmount || 0,
                    totalElectricityAmount || 0,
                    total_amount_due || 0,
                    dueDate,
                ]
            );
        }

        // 3️⃣ Upsert Meter Readings — safely update per month & utility type
        const readings = [
            {
                type: "water",
                prev: waterPrevReading,
                curr: waterCurrentReading,
            },
            {
                type: "electricity",
                prev: electricityPrevReading,
                curr: electricityCurrentReading,
            },
        ];

        for (const r of readings) {
            if (r.prev && r.curr) {
                const [existingReading]: any = await connection.query(
                    `
                        SELECT reading_id
                        FROM MeterReading
                        WHERE unit_id = ?
                          AND utility_type = ?
                          AND MONTH(reading_date) = MONTH(?)
                          AND YEAR(reading_date) = YEAR(?)
                        LIMIT 1
                    `,
                    [unit_id, r.type, readingDate, readingDate]
                );

                if (existingReading.length > 0) {
                    // ✅ Update existing reading
                    await connection.query(
                        `
                            UPDATE MeterReading
                            SET previous_reading = ?,
                                current_reading = ?,
                                reading_date = ?,
                                updated_at = NOW()
                            WHERE reading_id = ?
                        `,
                        [r.prev, r.curr, readingDate, existingReading[0].reading_id]
                    );
                } else {
                    // 🆕 Insert new reading
                    await connection.query(
                        `
                            INSERT INTO MeterReading
                            (unit_id, utility_type, reading_date, previous_reading, current_reading)
                            VALUES (?, ?, ?, ?, ?)
                        `,
                        [unit_id, r.type, readingDate, r.prev, r.curr]
                    );
                }
            }
        }

        // 4️⃣ Delete old charges (avoid duplication)
        await connection.query(
            `DELETE FROM BillingAdditionalCharge WHERE billing_id = ?`,
            [billing_id]
        );

        // 5️⃣ Insert new additional & discount charges
        if (Array.isArray(additionalCharges) && additionalCharges.length > 0) {
            for (const charge of additionalCharges) {
                if (!charge.charge_type || isNaN(charge.amount)) continue;

                await connection.query(
                    `
                        INSERT INTO BillingAdditionalCharge
                            (billing_id, charge_category, charge_type, amount)
                        VALUES (?, ?, ?, ?)
                    `,
                    [
                        billing_id,
                        charge.charge_category || "additional",
                        charge.charge_type.trim(),
                        parseFloat(charge.amount),
                    ]
                );
            }
        }

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                billing_id,
                message: isUpdate
                    ? "Billing updated successfully with charges and readings"
                    : "Billing created successfully with charges and readings",
            },
            { status: isUpdate ? 200 : 201 }
        );
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("❌ Error saving billing:", error);
        return NextResponse.json(
            { error: "Failed to save billing record.", details: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

/**
 * 🆕 POST → Create new billing (or update if exists)
 */
export async function POST(req: NextRequest) {
    return upsertBilling(req);
}

/**
 * 🆕 PUT → Explicit update request
 */
export async function PUT(req: NextRequest) {
    return upsertBilling(req);
}
