import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();
        console.log('Received lease update:', body);

        const { unit_id, start_date, end_date } = body;

        if (!unit_id || !start_date || !end_date) {
            return NextResponse.json(
                { error: "Unit ID, start date and end date are required" },
                { status: 400 }
            );
        }

        console.log(`startdate ${start_date}`)

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (endDate <= startDate) {
            return NextResponse.json(
                { error: "End date must be after the start date" },
                { status: 400 }
            );
        }

        const [tenantRows] = await connection.execute(
            "SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ? AND status = 'approved' LIMIT 1",
            [unit_id]
        );
console.log('teenant rows:', tenantRows);
        // @ts-ignore
        if (tenantRows.length === 0) {
            return NextResponse.json(
                { error: "No approved tenant found for this unit" },
                { status: 404 }
            );
        }

        // @ts-ignore
        const tenant_id = tenantRows[0].tenant_id;
console.log('tenant_id:', tenant_id);
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `UPDATE LeaseAgreement 
       SET start_date = ?, end_date = ?, status = 'active' 
       WHERE unit_id = ? AND tenant_id = ?`,
            [start_date, end_date, unit_id, tenant_id]
        );

        await connection.commit();

        // @ts-ignore
        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: "No lease agreement found to update" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Lease updated successfully", start_date, end_date },
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
