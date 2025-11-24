import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        if (!property_id) {
            return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
        }

        /* ======================================================
           1️⃣  GROSS REVENUE — Confirmed Billing Payments
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
            WHERE u.property_id = ?
              AND p.payment_status = 'confirmed'
              AND p.payment_type = 'billing'
            GROUP BY ym, month_label
            ORDER BY ym ASC
        `,
            [property_id]
        );

        /* ======================================================
           2️⃣  PROPERTY EXPENSES — ConcessionaireBilling
           Group by period_start month
        ====================================================== */
        const [expenseRows] = await db.query(
            `
            SELECT
                DATE_FORMAT(cb.period_start, '%Y-%m') AS ym,
                DATE_FORMAT(cb.period_start, '%b %Y') AS month_label,
                SUM(
                    COALESCE(cb.water_total, 0) +
                    COALESCE(cb.electricity_total, 0)
                ) AS totalExpense
            FROM rentalley_db.ConcessionaireBilling cb
            WHERE cb.property_id = ?
            GROUP BY ym, month_label
            ORDER BY ym ASC
        `,
            [property_id]
        );

        /* ======================================================
           3️⃣ Normalize month keys
        ====================================================== */
        const monthKeys = Array.from(
            new Set([
                ...revenueRows.map((r: any) => r.ym),
                ...expenseRows.map((e: any) => e.ym),
            ])
        ).sort();

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
           4️⃣ Final Response (Property-Specific)
        ====================================================== */
        return NextResponse.json({
            months: monthKeys.map((ym) => labelMap.get(ym)),
            revenue: monthKeys.map((ym) => revenueMap.get(ym) || 0),
            expenses: monthKeys.map((ym) => expenseMap.get(ym) || 0),
            noi: monthKeys.map(
                (ym) => (revenueMap.get(ym) || 0) - (expenseMap.get(ym) || 0)
            ),
        });

    } catch (error: any) {
        console.error("Error fetching revenue-expense trend:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
