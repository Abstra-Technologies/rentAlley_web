import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();
    try {
        const { property_id, unit_id, agreement_id, total, additional_charges } = await req.json();

        if (!property_id || !unit_id || !agreement_id || total === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connection.beginTransaction();

        // 1. Find existing billing record for this unit & current month
        const [existing]: any = await connection.query(
            `SELECT billing_id
             FROM Billing
             WHERE unit_id = ?
               AND MONTH(billing_period) = MONTH(CURDATE())
               AND YEAR(billing_period) = YEAR(CURDATE())
             LIMIT 1`,
            [unit_id]
        );

        let billing_id;

        if (existing.length > 0) {
            // ✅ Update existing bill
            billing_id = existing[0].billing_id;
            await connection.query(
                `UPDATE Billing
                 SET total_amount_due = ?, status = 'unpaid'
                 WHERE billing_id = ?`,
                [total, billing_id]
            );
        } else {
            // ⚡ Safety: if no bill exists (edge case), insert a new one
            const [billingResult]: any = await connection.query(
                `INSERT INTO Billing (unit_id, billing_period, total_amount_due, due_date, status)
                 VALUES (?, CURDATE(), ?, DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'unpaid')`,
                [unit_id, total]
            );
            billing_id = billingResult.insertId;
        }

        // 2. Insert additional charges / discounts if provided
        if (additional_charges && Array.isArray(additional_charges)) {
            for (const charge of additional_charges) {
                if (!charge.type || !charge.amount) continue;

                await connection.query(
                    `INSERT INTO BillingAdditionalCharge (billing_id, charge_category, charge_type, amount)
                     VALUES (?, ?, ?, ?)`,
                    [
                        billing_id,
                        charge.category || "additional", // "additional" | "discount"
                        charge.type,
                        charge.amount,
                    ]
                );
            }
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            billing_id,
            message:
                existing.length > 0
                    ? "Billing updated and charges saved successfully"
                    : "Billing created and charges saved successfully",
        });
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("Error saving non-submetered bill:", error);
        return NextResponse.json(
            { error: "Failed to save non-submetered bill" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
