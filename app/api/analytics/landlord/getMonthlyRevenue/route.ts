
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlord_id");

    if (!landlordId) {
        return NextResponse.json(
            { error: "landlord_id is required" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.execute(
            `
      SELECT
          DATE_FORMAT(p.payment_date, '%b') AS month,
          MONTH(p.payment_date) AS month_num,
          YEAR(p.payment_date) AS year_num,
          pr.property_id,
          pr.property_name,
          SUM(p.amount_paid) AS total_revenue
      FROM Payment p
          JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
          JOIN Unit u ON la.unit_id = u.unit_id
          JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
        AND p.payment_status = 'confirmed'
      GROUP BY year_num, month_num, pr.property_id, pr.property_name
      ORDER BY year_num ASC, month_num ASC
      `,
            [landlordId]
        );

        // 🔹 Ensure we return every month in the current year (even with no payments)
        const now = new Date();
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(now.getFullYear(), i, 1);
            return {
                month: date.toLocaleString("en-US", { month: "short" }),
                month_num: i + 1,
                year_num: now.getFullYear(),
            };
        });

        // 🔹 Normalize rows into complete dataset
        const result = months.flatMap(({ month, month_num, year_num }) => {
            const monthlyRows = rows.filter(
                (r: any) => r.month_num === month_num && r.year_num === year_num
            );

            if (monthlyRows.length === 0) {
                // no payments → return a placeholder
                return [
                    {
                        month,
                        property_id: null,
                        property_name: "All Properties",
                        total_revenue: 0,
                    },
                ];
            }

            return monthlyRows.map((r: any) => ({
                month,
                property_id: r.property_id,
                property_name: r.property_name,
                total_revenue: Number(r.total_revenue),
            }));
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("Error fetching monthly revenue:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
