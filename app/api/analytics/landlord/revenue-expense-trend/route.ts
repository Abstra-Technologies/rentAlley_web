import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");
        const yearParam = searchParams.get("year");

        if (!property_id) {
            return NextResponse.json(
                { error: "Missing property_id" },
                { status: 400 }
            );
        }

        const year = Number(yearParam || new Date().getFullYear());

        /* ======================================================
           1️⃣ POTENTIAL GROSS INCOME (PGI)
           Sum expected rent per month for ACTIVE leases
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
           2️⃣ ACTUAL COLLECTED RENT
        ====================================================== */
        const [revenueRows]: any = await db.query(
            `
            SELECT
                DATE_FORMAT(b.billing_period, '%Y-%m') AS ym,
                SUM(p.amount_paid) AS collected
            FROM Payment p
            JOIN Billing b ON p.bill_id = b.billing_id
            JOIN Unit u ON b.unit_id = u.unit_id
            WHERE u.property_id = ?
              AND YEAR(b.billing_period) = ?
              AND p.payment_status = 'confirmed'
              AND p.payment_type in ('billing', 'rent', 'advance_payment', 'security_deposit')
            GROUP BY ym
            `,
            [property_id, year]
        );

        /* ======================================================
           3️⃣ OPERATING EXPENSES (Utilities)
        ====================================================== */
        const [expenseRows]: any = await db.query(
            `
            SELECT
                DATE_FORMAT(cb.period_start, '%Y-%m') AS ym,
                SUM(
                    COALESCE(cb.water_total, 0) +
                    COALESCE(cb.electricity_total, 0)
                ) AS opex
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

        const pgiMap = new Map(pgiRows.map((r: any) => [r.ym, Number(r.pgi || 0)]));
        const collectedMap = new Map(revenueRows.map((r: any) => [r.ym, Number(r.collected || 0)]));
        const opexMap = new Map(expenseRows.map((r: any) => [r.ym, Number(r.opex || 0)]));

        /* ======================================================
           5️⃣ CALCULATIONS
        ====================================================== */
        const metrics = {
            monthNames: monthKeys.map((ym) =>
                new Date(`${ym}-01`).toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                })
            ),

            grossRentTrend: [],
            noiTrend: [],

            grossRent: {},
            noi: {},
        };

        let totalGOI = 0;
        let totalNOI = 0;

        monthKeys.forEach((ym) => {
            const pgi = pgiMap.get(ym) || 0;
            const collected = collectedMap.get(ym) || 0;
            const vacancyLoss = Math.max(pgi - collected, 0);
            const otherIncome = 0; // Future-ready
            const goi = (pgi - vacancyLoss) + otherIncome;
            const opex = opexMap.get(ym) || 0;
            const noi = goi - opex;

            metrics.grossRentTrend.push(goi);
            metrics.noiTrend.push(noi);

            totalGOI += goi;
            totalNOI += noi;
        });

        /* ======================================================
           6️⃣ SUMMARY METRICS (YTD)
        ====================================================== */
        metrics.grossRent.ytd = {
            current: totalGOI,
            last: 0,
            variance: 0,
        };

        metrics.noi.ytd = {
            current: totalNOI,
            last: 0,
            variance: 0,
        };

        return NextResponse.json({
            year,
            metrics,
        });
    } catch (error: any) {
        console.error("❌ NOI Analytics Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
