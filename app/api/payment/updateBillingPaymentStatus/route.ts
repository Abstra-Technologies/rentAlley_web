import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const user_id = payload?.user_id;

        if (!user_id) {
            return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
        }

        // 🔹 Parse request body
        const body = await req.json();
        const {
            tenant_id,
            requestReferenceNumber,
            amount,
            billing_id,
            payment_status,
            payment_method_id = 7,
        } = body;

        if (!tenant_id || !requestReferenceNumber || !amount || !billing_id) {
            return NextResponse.json(
                { message: "Missing required fields." },
                { status: 400 }
            );
        }

        // 🔹 1. Find active lease for tenant
        const [leaseRows]: any = await db.query(
            `
        SELECT agreement_id
        FROM LeaseAgreement
        WHERE tenant_id = ?
          AND status = 'active'
        LIMIT 1
      `,
            [tenant_id]
        );

        if (!leaseRows.length) {
            return NextResponse.json(
                { message: "No active lease found for this tenant." },
                { status: 404 }
            );
        }

        const { agreement_id } = leaseRows[0];

        // 🔹 2. Check if payment already exists
        const [existing]: any = await db.query(
            `SELECT payment_id FROM Payment WHERE receipt_reference = ? LIMIT 1`,
            [requestReferenceNumber]
        );

        if (existing.length > 0) {
            // ✅ Update existing payment
            await db.query(
                `
          UPDATE Payment
          SET
            amount_paid = ?,
            payment_status = ?,
            updated_at = NOW()
          WHERE receipt_reference = ?
        `,
                [amount, payment_status, requestReferenceNumber]
            );
        } else {
            // ✅ Insert new payment
            await db.query(
                `
          INSERT INTO Payment (
            agreement_id,
            billing_id,
            payment_type,
            amount_paid,
            payment_method_id,
            payment_status,
            receipt_reference,
            created_at
          )
          VALUES (?, ?, 'billing', ?, ?, ?, ?, NOW())
        `,
                [
                    agreement_id,
                    billing_id,
                    amount,
                    payment_method_id,
                    payment_status,
                    requestReferenceNumber,
                ]
            );
        }

        // 🔹 3. Update Billing table
        if (payment_status === "confirmed") {
            await db.query(
                `
          UPDATE Billing 
          SET status = 'paid', paid_at = NOW(), updated_at = NOW()
          WHERE billing_id = ?
        `,
                [billing_id]
            );
        } else if (payment_status === "cancelled") {
            await db.query(
                `
          UPDATE Billing 
          SET status = 'unpaid', paid_at = NULL, updated_at = NOW()
          WHERE billing_id = ?
        `,
                [billing_id]
            );
        }

        // 🔹 4. Insert ActivityLog entry (same as sample)
        const actionText =
            payment_status === "confirmed"
                ? `Confirmed payment of ₱${Number(amount).toLocaleString()} for Billing #${billing_id}`
                : `Cancelled payment for Billing #${billing_id}`;

        await db.query(
            `INSERT INTO rentalley_db.ActivityLog (user_id, action, timestamp)
       VALUES (?, ?, NOW())`,
            [user_id, actionText]
        );

        // ✅ 5. Return response
        return NextResponse.json(
            {
                message:
                    payment_status === "cancelled"
                        ? "Cancelled payment recorded successfully."
                        : "Payment confirmed successfully.",
                tenant_id,
                agreement_id,
                billing_id,
                payment_status,
                requestReferenceNumber,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Error processing payment:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
