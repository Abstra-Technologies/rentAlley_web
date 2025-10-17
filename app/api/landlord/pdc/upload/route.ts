import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection(); // explicit connection for transaction
    await connection.beginTransaction();

    try {
        const body = await req.json();
        const {
            lease_id,
            check_number,
            bank_name,
            amount,
            issue_date,
            notes,
            uploaded_image_url,
        } = body;

        console.log('issue date', issue_date);

        // ✅ Input Validation
        if (!lease_id || !check_number || !amount || !issue_date) {
            await connection.rollback();
            connection.release();
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            await connection.rollback();
            connection.release();
            return NextResponse.json(
                { error: "Invalid amount specified." },
                { status: 400 }
            );
        }

        const formattedDate = new Date(issue_date);
        if (isNaN(formattedDate.getTime())) {
            await connection.rollback();
            connection.release();
            return NextResponse.json(
                { error: "Invalid date format for issue_date." },
                { status: 400 }
            );
        }

        // ✅ IDEMPOTENCE: Check if PDC already exists for same lease/check_number
        const [existing]: any = await connection.query(
            `SELECT pdc_id FROM PostDatedCheck WHERE lease_id = ? AND check_number = ? LIMIT 1`,
            [lease_id, check_number]
        );

        if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return NextResponse.json(
                {
                    message:
                        "A PDC with this check number already exists for this lease. No duplicate created.",
                    pdc_id: existing[0].pdc_id,
                    idempotent: true,
                },
                { status: 200 }
            );
        }

        // ✅ ATOMIC INSERT
        const [result]: any = await connection.query(
            `
            INSERT INTO PostDatedCheck
                (lease_id, check_number, bank_name, amount, due_date, notes, uploaded_image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                lease_id,
                check_number,
                bank_name || null,
                parsedAmount,
                issue_date,
                notes || null,
                uploaded_image_url || null,
            ]
        );

        // ✅ Commit transaction
        await connection.commit();
        connection.release();

        return NextResponse.json(
            {
                message: "Post-dated check recorded successfully.",
                pdc_id: result.insertId,
                idempotent: false,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("❌ PDC Transaction Error:", error);

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error("⚠️ Rollback failed:", rollbackError);
        } finally {
            connection.release();
        }

        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                {
                    error:
                        "A check with this number already exists for this lease.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                error: "Internal server error.",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
