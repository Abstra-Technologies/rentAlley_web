
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // adjust to your db path

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");

        if (!landlordId) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        const query = `
      SELECT
          p.payment_id,
          p.payment_type,
          p.amount_paid,
          p.payment_status,
          p.payment_date,
          p.receipt_reference,
          u.unit_name,
          pr.property_name
      FROM Payment p
          JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
          JOIN Unit u ON la.unit_id = u.unit_id
          JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?;
    `;

        const [rows] = await db.execute(query, [landlordId]);

        return NextResponse.json(rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching payments:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
