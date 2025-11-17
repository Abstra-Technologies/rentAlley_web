import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        /* ======================================================
           1️⃣  GROSS REVENUE (Confirmed Billing Payments)
           Uses Payment.bill_id → Billing.billing_id  (CORRECT)
        ====================================================== */
        const [revenueRows] = await db.query(
            `
            SELECT
                DATE_FORMAT(b.billing_period, '%Y-%m') AS ym,
                DATE_FORMAT(b.billing_period, '%b %Y') AS month_label,
                SUM(p.amount_paid) AS totalRevenue
            FROM rentalley_db.Payment p
            JOIN rentalley_db.Billing b 
                ON p.bill_id = b.billing_id
            JOIN rentalley_db.Unit u 
                ON b.unit_id = u.unit_id
            JOIN rentalley_db.Property pr 
                ON u.property_id = pr.property_id
            WHERE pr.landlord_id = ?
              AND p.payment_status IN ('confirmed', 'paid')
              AND p.payment_type = 'billing'
            GROUP BY ym, month_label
            ORDER BY ym ASC
        `,
            [landlord_id]
        );

        /* ======================================================
           2️⃣  EXPENSES (Property Monthly Utilities)
           Uses: PropertyMonthlyUtility → water_total + electricity_total
        ====================================================== */
        const [expenseRows] = await db.query(
            `
            SELECT
                DATE_FORMAT(pmu.billing_period, '%Y-%m') AS ym,
                DATE_FORMAT(pmu.billing_period, '%b %Y') AS month_label,
                SUM(
                    COALESCE(pmu.water_total, 0) +
                    COALESCE(pmu.electricity_total, 0)
                ) AS totalExpense
            FROM rentalley_db.PropertyMonthlyUtility pmu
            JOIN rentalley_db.Property pr 
                ON pmu.property_id = pr.property_id
            WHERE pr.landlord_id = ?
            GROUP BY ym, month_label
            ORDER BY ym ASC
        `,
            [landlord_id]
        );

        /* ======================================================
           3️⃣ Normalize months correctly using YYYY-MM
        ====================================================== */

        const monthKeys = Array.from(
            new Set([
                ...revenueRows.map((r: any) => r.ym),
                ...expenseRows.map((e: any) => e.ym),
            ])
        ).sort(); // YYYY-MM sorts correctly

        // Build maps
        const revenueMap = new Map(
            revenueRows.map((row: any) => [row.ym, Number(row.totalRevenue || 0)])
        );
        const expenseMap = new Map(
            expenseRows.map((row: any) => [row.ym, Number(row.totalExpense || 0)])
        );
        const labelMap = new Map(
            [...revenueRows, ...expenseRows].map((row: any) => [row.ym, row.month_label])
        );

        /* ======================================================
           4️⃣ Final Response
        ====================================================== */
        return NextResponse.json({
            months: monthKeys.map((ym) => labelMap.get(ym)),
            revenue: monthKeys.map((ym) => revenueMap.get(ym) || 0),
            expenses: monthKeys.map((ym) => expenseMap.get(ym) || 0),

            // Optional: NOI (Instant calculation)
            noi: monthKeys.map((ym) => (revenueMap.get(ym) || 0) - (expenseMap.get(ym) || 0)),
        });

    } catch (error: any) {
        console.error("Error fetching revenue-expense trend:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
