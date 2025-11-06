import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");
        const propertyId = searchParams.get("property_id");
        const month = searchParams.get("month"); // format: YYYY-MM

        if (!landlordId) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        // ✅ Base query: include only confirmed payments
        let query = `
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
      WHERE pr.landlord_id = ?
        AND p.payment_status = 'confirmed'
    `;

        const params: any[] = [landlordId];

        if (propertyId) {
            query += ` AND pr.property_id = ?`;
            params.push(propertyId);
        }

        if (month) {
            // e.g. month = "2025-10" → matches YYYY-MM
            query += ` AND DATE_FORMAT(p.payment_date, '%Y-%m') = ?`;
            params.push(month);
        }

        query += ` ORDER BY p.payment_date DESC`;

        const [rows]: any = await db.query(query, params);

        return NextResponse.json(rows, { status: 200 });
    } catch (error) {
        console.error("❌ Error fetching payments:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
