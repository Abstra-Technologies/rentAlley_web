import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const property_id = searchParams.get("property_id");
  const unit_id = searchParams.get("unit_id");

  let connection;

  try {
    connection = await db.getConnection();

    let query = `
      SELECT
        u.*,
        la.agreement_id AS lease_agreement_id,
        la.start_date,
        la.end_date,
        la.billing_due_day,
        la.status AS lease_status,
        -- Compute next due date based on billing_due_day
        CASE
          WHEN DAY(CURDATE()) <= la.billing_due_day
            THEN DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()), '-', la.billing_due_day))
          ELSE DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()) + 1, '-', la.billing_due_day))
          END AS next_due_date,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM LeaseAgreement lap
            WHERE lap.unit_id = u.unit_id AND lap.status = 'pending'
          )
            THEN 1 ELSE 0
          END AS hasPendingLease
      FROM Unit u
             LEFT JOIN LeaseAgreement la
                       ON la.unit_id = u.unit_id
                         AND la.status = 'active'
      WHERE 1=1
    `;

    const params: any[] = [];

    if (unit_id) {
      query += ` AND u.unit_id = ?`;
      params.push(unit_id);
    }

    if (property_id) {
      query += ` AND u.property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await connection.execute(query, params);

    // @ts-ignore
    if (unit_id && rows.length === 0) {
      return new Response(
          JSON.stringify({ error: "No Units found for this Property" }),
          { status: 404 }
      );
    }

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error fetching unit listings:", error);
    return new Response(
        JSON.stringify({ error: "Failed to fetch unit listings" }),
        { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
