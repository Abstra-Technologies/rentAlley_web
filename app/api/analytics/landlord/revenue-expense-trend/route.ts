import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route   GET /api/analytics/landlord/revenue-expense-trend?landlord_id=<id>
 * @desc    Returns monthly revenue vs expense trend based on payment and concessionaire billing data.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        // 🟢 1. Revenue (from Payment table, only confirmed or paid)
        const [revenueRows] = await db.query(`
            SELECT
                DATE_FORMAT(b.billing_period, '%b %Y') AS month,
                SUM(p.amount_paid) AS totalRevenue
            FROM Payment p
                     JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
                     JOIN Unit u ON la.unit_id = u.unit_id
                     JOIN Property pr ON u.property_id = pr.property_id
                     JOIN Billing b ON la.agreement_id = b.lease_id
            WHERE pr.landlord_id = ?
              AND (p.payment_status IN ('confirmed', 'paid'))
            GROUP BY DATE_FORMAT(b.billing_period, '%Y-%m')
            ORDER BY MIN(b.billing_period);
        `, [landlord_id]);

        // 🔴 2. Expenses (from ConcessionaireBilling for landlord properties)
        const [expenseRows] = await db.query(`
            SELECT
                DATE_FORMAT(cb.billing_period, '%b %Y') AS month,
                SUM(
                        COALESCE(cb.water_total, 0) +
                        COALESCE(cb.electricity_total, 0)
                ) AS totalExpense
            FROM ConcessionaireBilling cb
                     JOIN Property p ON cb.property_id = p.property_id
            WHERE p.landlord_id = ?
            GROUP BY DATE_FORMAT(cb.billing_period, '%Y-%m')
            ORDER BY MIN(cb.billing_period);
        `, [landlord_id]);

        // 🧮 Merge months for chart
        const allMonths = Array.from(
            new Set([
                ...revenueRows.map((r: any) => r.month),
                ...expenseRows.map((e: any) => e.month),
            ])
        ).sort((a, b) => {
            // Sort by chronological order
            return new Date(a).getTime() - new Date(b).getTime();
        });

        const revenueMap = new Map(
            revenueRows.map((r: any) => [r.month, Number(r.totalRevenue || 0)])
        );
        const expenseMap = new Map(
            expenseRows.map((e: any) => [e.month, Number(e.totalExpense || 0)])
        );

        const trendData = {
            months: allMonths,
            revenue: allMonths.map((m) => revenueMap.get(m) || 0),
            expenses: allMonths.map((m) => expenseMap.get(m) || 0),
        };

        return NextResponse.json(trendData, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching revenue-expense trend:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
