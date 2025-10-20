import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();
        const { unit_id, start_date, end_date } = body;

        // ✅ Validate required fields
        if (!unit_id || !start_date || !end_date) {
            return NextResponse.json(
                { error: "Unit ID, start date, and end date are required" },
                { status: 400 }
            );
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (endDate <= startDate) {
            return NextResponse.json(
                { error: "End date must be after the start date" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // ✅ Step 1: Try to get tenant_id from LeaseAgreement
        const [leaseRows]: any = await connection.execute(
            `
                SELECT tenant_id
                FROM LeaseAgreement
                WHERE unit_id = ?
                  AND status IN ('pending', 'sent', 'draft')
                LIMIT 1
            `,
            [unit_id]
        );

        let tenant_id: string | null = null;

        if (leaseRows.length > 0) {
            tenant_id = leaseRows[0].tenant_id;
            console.log("Using tenant_id from LeaseAgreement:", tenant_id);
        } else {
            // ✅ Step 2: Fallback to ProspectiveTenant (approved)
            const [prospectiveRows]: any = await connection.execute(
                `
                    SELECT tenant_id
                    FROM ProspectiveTenant
                    WHERE unit_id = ?
                      AND status = 'approved'
                    LIMIT 1
                `,
                [unit_id]
            );

            if (prospectiveRows.length === 0) {
                return NextResponse.json(
                    { error: "No pending lease or approved tenant found" },
                    { status: 404 }
                );
            }

            tenant_id = prospectiveRows[0].tenant_id;
            console.log("Using tenant_id from ProspectiveTenant:", tenant_id);
        }

        // ✅ Step 3: Update lease if exists
        const [result]: any = await connection.execute(
            `
                UPDATE LeaseAgreement
                SET start_date = ?,
                    end_date = ?,
                    status = 'active',
                    agreement_url = agreement_url,
                    is_security_deposit_paid = 1,
                    is_advance_payment_paid = 1,
                    grace_period_days = 3
                WHERE unit_id = ?
                  AND tenant_id = ?
            `,
            [start_date, end_date, unit_id, tenant_id]
        );

        // ✅ Step 4: Insert new lease if none exists
        if (result.affectedRows === 0) {
            await connection.execute(
                `
                    INSERT INTO LeaseAgreement (
                        tenant_id,
                        unit_id,
                        start_date,
                        end_date,
                        status,
                        agreement_url,
                        is_security_deposit_paid,
                        is_advance_payment_paid,
                        grace_period_days
                    )
                    VALUES (?, ?, ?, ?, 'active', NULL, 1, 1, 3)
                `,
                [tenant_id, unit_id, start_date, end_date]
            );
        }

        await connection.commit();

        return NextResponse.json(
            {
                message:
                    "Lease updated successfully (marked as paid, no lease uploaded)",
                start_date,
                end_date,
            },
            { status: 200 }
        );
    } catch (error) {
        await connection.rollback();
        console.error("Error updating lease:", error);
        return NextResponse.json(
            { error: "Failed to update lease" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
