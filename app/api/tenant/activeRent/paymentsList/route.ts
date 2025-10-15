import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");
    if (!agreement_id)
        return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });

    const [rows]: any = await db.query(
        `SELECT p.payment_id, p.amount_paid, p.payment_status, p.payment_type,
            pm.method_name AS payment_method_name, 
            p.payment_date, p.receipt_reference, p.proof_of_payment
     FROM Payment p
     LEFT JOIN PaymentMethod pm ON p.payment_method_id = pm.method_id
     WHERE p.agreement_id = ?
     ORDER BY p.payment_date DESC`,
        [agreement_id]
    );

    return NextResponse.json(rows);
}
