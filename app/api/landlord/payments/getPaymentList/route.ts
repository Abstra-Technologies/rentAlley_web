import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");
        const propertyId = searchParams.get("property_id");
        const month = searchParams.get("month"); // format: YYYY-MM

        if (!landlordId) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        let query = `
      SELECT
          p.payment_id,
          p.payment_type,
          p.amount_paid,
          p.payment_status,
          p.payment_date,
          p.receipt_reference,
          p.created_at,
          u.unit_name,
          pr.property_name,
          usr.firstName,
          usr.lastName
      FROM Payment p
          JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
          JOIN Tenant t ON la.tenant_id = t.tenant_id
          JOIN User usr ON t.user_id = usr.user_id
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
            query += ` AND DATE_FORMAT(p.payment_date, '%Y-%m') = ?`;
            params.push(month);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [rows]: any = await db.query(query, params);

        // 🔹 Decrypt tenant names (same pattern as your activity logs)
        const decryptedRows = rows.map((row: any) => {
            const decryptedRow = { ...row };

            try {
                if (row.firstName) {
                    const parsedFirst = JSON.parse(row.firstName);
                    decryptedRow.firstName = decryptData(parsedFirst, process.env.ENCRYPTION_SECRET);
                }

                if (row.lastName) {
                    const parsedLast = JSON.parse(row.lastName);
                    decryptedRow.lastName = decryptData(parsedLast, process.env.ENCRYPTION_SECRET);
                }

                decryptedRow.tenant_name = `${decryptedRow.firstName || ""} ${decryptedRow.lastName || ""}`.trim();
            } catch (decryptionError) {
                console.error(`Decryption failed for tenant in payment ID ${row.payment_id}:`, decryptionError);
                decryptedRow.tenant_name = "Unknown Tenant";
            }

            return decryptedRow;
        });

        return NextResponse.json(decryptedRows, { status: 200 });
    } catch (error) {
        console.error("❌ Error fetching payments:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
