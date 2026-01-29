import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/* --------------------------------------------------
   CACHED MONTHLY REVENUE QUERY (PER LANDLORD + YEAR)
-------------------------------------------------- */
const getMonthlyRevenueCached = unstable_cache(
    async (landlordId: string, year: number) => {
        const [rows]: any = await db.execute(
            `
      SELECT
        MONTH(p.payment_date) AS month_num,
        SUM(p.amount_paid) AS revenue
      FROM Payment p
      JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
        AND p.payment_status = 'confirmed'
        AND YEAR(p.payment_date) = ?
      GROUP BY month_num
      ORDER BY month_num ASC
      `,
            [landlordId, year]
        );

        /* -------- Normalize to 12 months for requested year -------- */
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(year, i, 1);
            return {
                month: date.toLocaleString("en-US", { month: "short" }),
                month_num: i + 1,
            };
        });

        return months.map(({ month, month_num }) => {
            const found = rows.find(
                (r: any) => r.month_num === month_num
            );

            return {
                month,
                revenue: found ? Number(found.revenue) : 0,
            };
        });
    },

    /* 🔑 Cache key MUST include year */
    (landlordId: string, year: number) => [
        "monthly-revenue",
        landlordId,
        year,
    ],

    {
        revalidate: 300, // 5 minutes
        tags: ["monthly-revenue"],
    }
);

/* --------------------------------------------------
   API HANDLER
-------------------------------------------------- */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const landlordId = searchParams.get("landlordId");
    const yearParam = searchParams.get("year");

    if (!landlordId || !yearParam) {
        return NextResponse.json(
            { error: "landlordId and year are required" },
            { status: 400 }
        );
    }

    const year = Number(yearParam);
    if (Number.isNaN(year)) {
        return NextResponse.json(
            { error: "Invalid year" },
            { status: 400 }
        );
    }

    try {
        const result = await getMonthlyRevenueCached(landlordId, year);
        return NextResponse.json(result, { status: 200 });
    } catch (err) {
        console.error("[MONTHLY_REVENUE_CACHE_ERROR]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
