
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Missing landlord_id parameter" },
            { status: 400 }
        );
    }

    try {
        const [rows] = await db.query(
            `
      SELECT 
        SUM(CASE 
              WHEN b.status = 'paid' THEN b.total_amount_due 
              ELSE 0 END) AS total_collected,
        SUM(CASE 
              WHEN b.status = 'unpaid' AND b.due_date >= CURDATE() 
              THEN b.total_amount_due 
              ELSE 0 END) AS total_pending,
        SUM(CASE 
              WHEN b.status = 'unpaid' AND b.due_date < CURDATE() 
              THEN b.total_amount_due 
              ELSE 0 END) AS total_overdue
      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
      `,
            [landlord_id]
        );

        // @ts-ignore
        return NextResponse.json(rows[0], { status: 200 });
    } catch (error) {
        console.error("Error fetching receivables:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
