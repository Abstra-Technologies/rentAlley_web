import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            amount,
            description,
            category,
            reference_type,
            reference_id,
            created_by,
            new_status,          // NEW
            completion_date,     // NEW
        } = body;

        if (!amount || Number(amount) <= 0) {
            return NextResponse.json(
                { success: false, message: "Valid expense amount is required" },
                { status: 400 }
            );
        }

        // ⭐ Insert into universal Expenses table
        await db.query(
            `
            INSERT INTO Expenses
                (amount, description, category, reference_type, reference_id, created_by, created_at)
            VALUES 
                (?, ?, ?, ?, ?, ?, NOW())
            `,
            [
                amount,
                description || null,
                category || "other",
                reference_type || null,
                reference_id || null,
                created_by || null,
            ]
        );

        // ⭐ If the reference is a maintenance request → update status
        if (reference_type === "maintenance" && reference_id) {
            await db.query(
                `
                UPDATE MaintenanceRequest
                SET 
                    status = COALESCE(?, status),
                    completion_date = COALESCE(?, completion_date)
                WHERE request_id = ?
                `,
                [
                    new_status || null,
                    completion_date || null,
                    reference_id,
                ]
            );
        }

        return NextResponse.json({
            success: true,
            message: "Expense recorded successfully",
        });

    } catch (error) {
        console.error("General Expense API Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
                error: error.message || error,
            },
            { status: 500 }
        );
    }
}
