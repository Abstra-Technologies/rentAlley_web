import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let agreementId = searchParams.get("agreement_id");
        const userId = searchParams.get("user_id");

        console.log("🔍 [Overdue API] user_id:", userId);
        console.log("🔍 [Overdue API] agreement_id (initial):", agreementId);

        /* ------------------ 1️⃣ USER VALIDATION ------------------ */
        if (!userId) {
            console.warn("❌ user_id missing");
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        /* ------------------ 2️⃣ TENANT LOOKUP ------------------ */
        const [tenantRows]: any = await db.query(
            `SELECT tenant_id FROM Tenant WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        console.log("🧠 Tenant rows:", tenantRows);

        const tenantId = tenantRows?.[0]?.tenant_id;
        if (!tenantId) {
            console.warn("⚠️ No tenant found for user");
            return NextResponse.json({ bills: [] }, { status: 200 });
        }

        console.log("✅ tenant_id resolved:", tenantId);

        /* ------------------ 3️⃣ AGREEMENT FALLBACK ------------------ */
        if (!agreementId) {
            const [leaseRows]: any = await db.query(
                `
                SELECT agreement_id, start_date, status
                FROM LeaseAgreement
                WHERE tenant_id = ?
                  AND status = 'active'
                ORDER BY start_date DESC
                LIMIT 1
                `,
                [tenantId]
            );

            console.log("🧠 Active lease rows:", leaseRows);

            agreementId = leaseRows?.[0]?.agreement_id || null;
        }

        console.log("✅ agreement_id (resolved):", agreementId);

        if (!agreementId) {
            console.warn("⚠️ No active agreement found");
            return NextResponse.json({ bills: [] }, { status: 200 });
        }

        /* ------------------ 4️⃣ RAW BILLING DEBUG ------------------ */
        const [allBills]: any = await db.query(
            `
            SELECT billing_id, status, due_date, total_amount_due
            FROM Billing
            WHERE lease_id = ?
            ORDER BY due_date ASC
            `,
            [agreementId]
        );

        console.log("📦 ALL bills for lease:", allBills);

        /* ------------------ 5️⃣ OVERDUE FILTER QUERY ------------------ */
        const [rows]: any = await db.query(
            `
            SELECT
                billing_id,
                billing_period,
                due_date,
                total_amount_due,
                status,
                DATEDIFF(CURRENT_DATE(), due_date) AS days_overdue
            FROM Billing
            WHERE lease_id = ?
              AND status IN ('unpaid', 'overdue')
              AND due_date < CURRENT_DATE()
              AND total_amount_due > 0
            ORDER BY due_date ASC
            `,
            [agreementId]
        );

        console.log("🚨 OVERDUE bills result:", rows);

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
