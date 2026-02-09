import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const landlord_id = searchParams.get("landlord_id");
        const property_id = searchParams.get("property_id");
        const yearParam = searchParams.get("year");

        console.log('property id : ', property_id);

        if (!landlord_id || !property_id) {
            return NextResponse.json(
                { error: "Missing landlord_id or property_id" },
                { status: 400 }
            );
        }

        const year = Number(yearParam || new Date().getFullYear());

        /* ======================================================
           🔐 0️⃣ VERIFY PROPERTY OWNERSHIP
        ====================================================== */
        const [ownership]: any = await db.query(
            `
      SELECT property_id
      FROM Property
      WHERE property_id = ?
        AND landlord_id = ?
      LIMIT 1
      `,
            [property_id, landlord_id]
        );

        if (!ownership.length) {
            return NextResponse.json(
                { error: "Unauthorized property access" },
                { status: 403 }
            );
        }

        /* ======================================================
           1️⃣ POTENTIAL GROSS INCOME (PGI)
        ====================================================== */
        const [pgiRows]: any = await db.query(
            `
      SELECT
        DATE_FORMAT(la.start_date, '%Y-%m') AS ym,
        SUM(u.rent_amount) AS pgi
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      WHERE u.property_id = ?
        AND la.status IN ('active', 'completed')
        AND YEAR(la.start_date) <= ?
        AND (la.end_date IS NULL OR YEAR(la.end_date) >= ?)
      GROUP BY ym
      `,
            [property_id, year, year]
        );

        /* ======================================================
           2️⃣ ACTUAL COLLECTED REVENUE
        ====================================================== */
        const [revenueRows]: any = await db.query(
            `
      SELECT
        DATE_FORMAT(b.billing_period, '%Y-%m') AS ym,
        SUM(p.amount_paid) AS revenue
      FROM Payment p
      JOIN Billing b ON p.bill_id = b.billing_id
      JOIN Unit u ON b.unit_id = u.unit_id
      WHERE u.property_id = ?
        AND YEAR(b.billing_period) = ?
        AND p.payment_status = 'confirmed'
        AND p.payment_type IN (
          'monthly_rent',
          'monthly_billing',
          'monthly_utilities',
            'penalty',
          'advance_payment',
          'security_deposit'
        )
      GROUP BY ym
      `,
            [property_id, year]
        );

        /* ======================================================
           3️⃣ OPERATING EXPENSES
        ====================================================== */
        const [expenseRows]: any = await db.query(
            `
      SELECT
        DATE_FORMAT(cb.period_start, '%Y-%m') AS ym,
        SUM(
          COALESCE(cb.water_total, 0) +
          COALESCE(cb.electricity_total, 0)
        ) AS expenses
      FROM ConcessionaireBilling cb
      WHERE cb.property_id = ?
        AND YEAR(cb.period_start) = ?
      GROUP BY ym
      `,
            [property_id, year]
        );

        /* ======================================================
           4️⃣ NORMALIZE MONTHS
        ====================================================== */
        const monthKeys = Array.from(
            new Set([
                ...pgiRows.map((r: any) => r.ym),
                ...revenueRows.map((r: any) => r.ym),
                ...expenseRows.map((r: any) => r.ym),
            ])
        ).sort();

        const revenueMap = new Map(
            revenueRows.map((r: any) => [r.ym, Number(r.revenue || 0)])
        );

        const expenseMap = new Map(
            expenseRows.map((r: any) => [r.ym, Number(r.expenses || 0)])
        );

        /* ======================================================
           5️⃣ FINAL CHART RESPONSE
        ====================================================== */
        const months = monthKeys.map((ym) =>
            new Date(`${ym}-01`).toLocaleString("default", {
                month: "short",
                year: "numeric",
            })
        );

        const revenue = monthKeys.map((ym) => revenueMap.get(ym) || 0);
        const expenses = monthKeys.map((ym) => expenseMap.get(ym) || 0);

        return NextResponse.json({
            year,
            property_id,
            months,
            revenue,
            expenses,
        });
    } catch (error: any) {
        console.error("❌ Revenue–Expense Trend Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
