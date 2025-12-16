import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/* --------------------------------------------------
   CACHED MONTHLY REVENUE QUERY (per landlord)
-------------------------------------------------- */
const getMonthlyRevenueCached = unstable_cache(
    async (landlordId: string) => {
        const [rows]: any = await db.execute(
            `
      SELECT
        DATE_FORMAT(p.payment_date, '%b') AS month_short,
        MONTH(p.payment_date) AS month_num,
        YEAR(p.payment_date) AS year_num,
        SUM(p.amount_paid) AS revenue
      FROM Payment p
      JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
        AND p.payment_status = 'confirmed'
      GROUP BY year_num, month_num, month_short
      ORDER BY year_num ASC, month_num ASC
      `,
            [landlordId]
        );

        /* ---------------- Normalize to current year (12 months) ---------------- */
        const now = new Date();
        const year = now.getFullYear();

        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(year, i, 1);
            return {
                month: date.toLocaleString("en-US", { month: "short" }),
                month_num: i + 1,
                year_num: year,
            };
        });

        return months.map(({ month, month_num, year_num }) => {
            const found = rows.find(
                (r: any) =>
                    r.month_num === month_num && r.year_num === year_num
            );

            return {
                month,
                revenue: found ? Number(found.revenue) : 0,
            };
        });
    },

    /* 🔑 Cache key */
    (landlordId: string) => ["monthly-revenue", landlordId],

    /* ⏱ Cache config */
    {
        revalidate: 300, // 5 minutes (analytics-safe)
        tags: ["monthly-revenue"],
    }
);

/* --------------------------------------------------
   API HANDLER
-------------------------------------------------- */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlordId");

    if (!landlordId) {
        return NextResponse.json(
            { error: "landlordId is required" },
            { status: 400 }
        );
    }

    try {
        const result = await getMonthlyRevenueCached(landlordId);
        return NextResponse.json(result, { status: 200 });
    } catch (err) {
        console.error("[MONTHLY_REVENUE_CACHE_ERROR]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
