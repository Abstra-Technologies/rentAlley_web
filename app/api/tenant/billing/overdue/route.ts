import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let agreementId = searchParams.get("agreement_id");
        const userId = searchParams.get("user_id");

        if (!userId) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        const [tenantRows]: any = await db.query(
            `SELECT tenant_id FROM Tenant WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        const tenantId = tenantRows?.[0]?.tenant_id;
        if (!tenantId) {
            return NextResponse.json({ bills: [] }, { status: 200 });
        }

        /* -------------------------------------------------
           2️⃣ Resolve agreement_id (fallback)
        ------------------------------------------------- */
        if (!agreementId) {
            const [leaseRows]: any = await db.query(
                `
                SELECT agreement_id
                FROM LeaseAgreement
                WHERE tenant_id = ?
                  AND status = 'active'
                ORDER BY start_date DESC
                LIMIT 1
                `,
                [tenantId]
            );

            agreementId = leaseRows?.[0]?.agreement_id || null;
        }

        if (!agreementId) {
            return NextResponse.json({ bills: [] }, { status: 200 });
        }

        /* -------------------------------------------------
           3️⃣ COMPUTE overdue bills
        ------------------------------------------------- */
        const [rows]: any = await db.query(
            `
            SELECT
                billing_id,
                billing_period,
                due_date,
                total_amount_due,
                DATEDIFF(CURRENT_DATE(), due_date) AS days_overdue
            FROM Billing
            WHERE lease_id = ?
              AND paid_at IS NULL
              AND due_date < CURRENT_DATE()
              AND total_amount_due > 0
            ORDER BY due_date ASC
            `,
            [agreementId]
        );

        return NextResponse.json(
            { bills: rows || [] },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Overdue billing fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch overdue bills" },
            { status: 500 }
        );
    }
}
