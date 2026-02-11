/*
* USE CASES
* components/landlord/analytics/PaymentSummaryCard.tsx
* */


import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/* --------------------------------------------------
   CACHED DB QUERY
   - landlord only
   - OR landlord + property
-------------------------------------------------- */
const getReceivablesSummary = unstable_cache(
    async (landlord_id: string, property_id?: string | null) => {
        const params: any[] = [landlord_id];

        let propertyFilter = "";
        if (property_id) {
            propertyFilter = "AND pr.property_id = ?";
            params.push(property_id);
        }

        const [rows]: any = await db.query(
            `
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'paid'
              THEN b.total_amount_due
              ELSE 0
            END
          ), 0
        ) AS total_collected,

        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'unpaid'
               AND b.due_date >= CURDATE()
              THEN b.total_amount_due
              ELSE 0
            END
          ), 0
        ) AS total_pending,

        COALESCE(
          SUM(
            CASE 
              WHEN b.status = 'unpaid'
               AND b.due_date < CURDATE()
              THEN b.total_amount_due
              ELSE 0
            END
          ), 0
        ) AS total_overdue

      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
      ${propertyFilter}
      `,
            params
        );

        return (
            rows?.[0] || {
                total_collected: 0,
                total_pending: 0,
                total_overdue: 0,
            }
        );
    },

    /* 🔑 CACHE KEY */
    (landlord_id: string, property_id?: string | null) => [
        "receivables-summary",
        landlord_id,
        property_id ?? "all",
    ],

    /* ⏱ CACHE CONFIG */
    {
        revalidate: 60, // 1 minute
        tags: ["receivables-summary"],
    }
);

/* --------------------------------------------------
   API HANDLER
-------------------------------------------------- */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const landlord_id = searchParams.get("landlord_id");
    const property_id = searchParams.get("property_id"); // 👈 OPTIONAL

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        const result = await getReceivablesSummary(
            landlord_id,
            property_id
        );

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[RECEIVABLES_CACHE_ERROR]", error);

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
