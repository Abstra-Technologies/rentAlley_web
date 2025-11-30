import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreementId = searchParams.get("agreement_id");


    if (!agreementId || agreementId.trim() === "") {
        return NextResponse.json(
            { error: "Agreement ID is required" },
            { status: 400 }
        );
    }

    try {
        const [leaseResult]: any = await db.query(
            `
                SELECT agreement_id, tenant_id, unit_id, is_renewal_of, status
                FROM LeaseAgreement
                WHERE agreement_id = ?
                LIMIT 1
            `,
            [agreementId]
        );

        const lease = leaseResult[0];

        if (!lease) {
            return NextResponse.json(
                { error: "Lease not found" },
                { status: 404 }
            );
        }

        const leaseIds: string[] = [lease.agreement_id];

        if (lease.is_renewal_of) {
            leaseIds.push(lease.is_renewal_of);
        } else {
            const [renewedLeases]: any = await db.query(
                `SELECT agreement_id FROM LeaseAgreement WHERE is_renewal_of = ?`,
                [lease.agreement_id]
            );
            renewedLeases.forEach((r: any) => leaseIds.push(r.agreement_id));
        }

        // 3️⃣ Fetch only confirmed, cancelled, or failed payments
        const [paymentResult]: any = await db.query(
            `
                SELECT
                    p.payment_id,
                    p.agreement_id,
                    p.bill_id,
                    p.payment_type,
                    p.amount_paid,
                    p.payment_status,
                    p.receipt_reference,
                    p.payment_date,
                    pm.method_name AS payment_method,
                    la.status AS lease_status
                FROM Payment p
                         JOIN PaymentMethod pm ON p.payment_method_id = pm.method_id
                         JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
                WHERE p.agreement_id IN (?)
                  AND p.payment_status IN ('confirmed', 'cancelled', 'failed')
                ORDER BY p.payment_date DESC
            `,
            [leaseIds]
        );

        if (paymentResult.length === 0) {
            return NextResponse.json(
                { message: "No confirmed, cancelled, or failed payments found for this lease or its renewals" },
                { status: 404 }
            );
        }

        // 4️⃣ Group payments by lease ID
        const groupedPayments = leaseIds.reduce((acc, id) => {
            acc[id] = paymentResult.filter((p: any) => p.agreement_id === id);
            return acc;
        }, {} as Record<string, any[]>);

        // 5️⃣ Return response
        return NextResponse.json({
            leaseAgreement: lease,
            leaseIds,
            payments: paymentResult,
            groupedPayments,
        });
    } catch (error: any) {
        console.error("❌ Error fetching filtered lease payments:", error);
        return NextResponse.json(
            { error: `Database Error: ${error.message || error}` },
            { status: 500 }
        );
    }
}
