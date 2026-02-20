import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    console.log("🟢 [PAYMENT HISTORY] Request received");

    const { searchParams } = new URL(req.url);
    const agreementId = searchParams.get("agreement_id");

    console.log("🔍 agreement_id:", agreementId);

    if (!agreementId || agreementId.trim() === "") {
        console.warn("⚠️ agreement_id missing");
        return NextResponse.json(
            { error: "agreement_id is required" },
            { status: 400 }
        );
    }

    try {
        /* ======================================
           1️⃣ Fetch base lease agreement
        ====================================== */
        console.log("📄 Fetching base lease");

        const [leaseRows]: any = await db.query(
            `
            SELECT
                agreement_id,
                is_renewal_of,
                tenant_id,
                unit_id,
                status
            FROM LeaseAgreement
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreementId]
        );

        const lease = leaseRows[0];

        if (!lease) {
            console.warn("❌ Lease not found:", agreementId);
            return NextResponse.json(
                { error: "Lease not found" },
                { status: 404 }
            );
        }

        console.log("✅ Lease found:", lease);

        /* ======================================
           2️⃣ Resolve ALL related lease IDs
        ====================================== */
        const leaseIds: string[] = [lease.agreement_id];

        if (lease.is_renewal_of) {
            console.log("🔁 Lease is renewal of:", lease.is_renewal_of);
            leaseIds.push(lease.is_renewal_of);
        } else {
            console.log("🔁 Checking renewals for:", lease.agreement_id);

            const [renewedRows]: any = await db.query(
                `
                SELECT agreement_id
                FROM LeaseAgreement
                WHERE is_renewal_of = ?
                `,
                [lease.agreement_id]
            );

            renewedRows.forEach((r: any) => leaseIds.push(r.agreement_id));
        }

        console.log("📌 Related lease IDs:", leaseIds);

        /* ======================================
           3️⃣ Fetch payments
        ====================================== */
        console.log("💳 Fetching payments");

        const [payments]: any = await db.query(
            `
            SELECT
              *
            FROM Payment
            WHERE agreement_id IN (?)
              AND payment_status IN ('confirmed', 'failed', 'cancelled')
            ORDER BY payment_date DESC
            `,
            [leaseIds]
        );

        if (!payments || payments.length === 0) {
            console.warn("⚠️ No payments found");
            return NextResponse.json(
                {
                    leaseAgreement: lease,
                    leaseIds,
                    payments: [],
                    groupedPayments: {},
                    message: "No payment records found"
                },
                { status: 200 }
            );
        }

        console.log(`✅ ${payments.length} payments found`);

        /* ======================================
           4️⃣ Group payments by agreement
        ====================================== */
        const groupedPayments = leaseIds.reduce((acc, id) => {
            acc[id] = payments.filter(
                (p: any) => p.agreement_id === id
            );
            return acc;
        }, {} as Record<string, any[]>);

        console.log("📦 Grouped payments ready");

        /* ======================================
           5️⃣ Response
        ====================================== */
        return NextResponse.json({
            leaseAgreement: lease,
            leaseIds,
            payments,
            groupedPayments,
        });

    } catch (error: any) {
        console.error("🔥 PAYMENT HISTORY ERROR:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
