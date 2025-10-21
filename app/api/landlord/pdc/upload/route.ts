import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const body = await req.json();
        const {
            lease_id,
            check_number,
            bank_name,
            amount,
            issue_date, // ✅ renamed (was issue_date)
            notes,
            uploaded_image_url,
        } = body;

        console.log("📩 Incoming PDC upload:", body);

        // ✅ Required fields
        if (!lease_id || !check_number || !amount || !issue_date) {
            throw new Error("Missing required fields: lease_id, check_number, amount, due_date.");
        }

        // ✅ Validate amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error("Invalid amount specified.");
        }

        // ✅ Validate date format (must be YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(issue_date)) {
            throw new Error("Invalid date format. Use YYYY-MM-DD.");
        }

        const formattedDate = new Date(issue_date);
        if (isNaN(formattedDate.getTime())) {
            throw new Error("Invalid or unparseable due_date.");
        }

        // ✅ Idempotence: Check duplicates
        const [existing]: any = await connection.query(
            `SELECT pdc_id FROM PostDatedCheck WHERE lease_id = ? AND check_number = ? LIMIT 1`,
            [lease_id, check_number]
        );

        if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return NextResponse.json(
                {
                    message: "A PDC with this check number already exists for this lease.",
                    pdc_id: existing[0].pdc_id,
                    idempotent: true,
                },
                { status: 200 }
            );
        }

        // ✅ Insert record atomically
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

        await connection.commit();
        connection.release();

        console.log(`✅ PDC inserted for lease_id ${lease_id} with check #${check_number}`);

        return NextResponse.json(
            {
                message: "Post-dated check recorded successfully.",
                pdc_id: result.insertId,
                idempotent: false,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("❌ PDC Upload Error:", error.message);

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error("⚠️ Rollback failed:", rollbackError);
        } finally {
            connection.release();
        }

        // Handle common cases
        if (error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { error: "A check with this number already exists for this lease." },
                { status: 409 }
            );
        }

        if (error.message.includes("Missing required")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (error.message.includes("Invalid date")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (error.message.includes("Invalid amount")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Internal server error.", details: error.message },
            { status: 500 }
        );
    }
}
