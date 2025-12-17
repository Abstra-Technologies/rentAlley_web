import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function GET(
    req: Request,
    context: { params: Promise<{ landlord_id: string }> }
) {
    const { landlord_id } = await context.params;

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Landlord ID is required" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
      SELECT
        u.user_id,
        u.firstName,
        u.lastName,
        pr.property_name,
        un.unit_name,

        /* SECURITY DEPOSIT PAID */
        EXISTS (
          SELECT 1
          FROM SecurityDeposit sd
          WHERE sd.lease_id = la.agreement_id
            AND sd.status IN ('paid', 'refunded', 'forfeited')
        ) AS sec_deposit_paid,

        /* ADVANCE PAYMENT PAID */
        EXISTS (
          SELECT 1
          FROM AdvancePayment ap
          WHERE ap.lease_id = la.agreement_id
            AND ap.status IN ('paid', 'applied')
        ) AS advance_paid

      FROM LeaseAgreement la
      JOIN Tenant t ON t.tenant_id = la.tenant_id
      JOIN User u ON u.user_id = t.user_id
      JOIN Unit un ON un.unit_id = la.unit_id
      JOIN Property pr ON pr.property_id = un.property_id

      WHERE pr.landlord_id = ?
      `,
            [landlord_id]
        );

        const decryptField = (val: any) => {
            if (!val) return "";
            try {
                return decryptData(JSON.parse(val), SECRET_KEY);
            } catch {
                return "";
            }
        };

        const tenants = rows.map((r: any) => ({
            user_id: r.user_id,
            firstName: decryptField(r.firstName),
            lastName: decryptField(r.lastName),
            property_name: r.property_name,
            unit_name: r.unit_name,
            secDepositPaid: Boolean(r.sec_deposit_paid),
            advPaymentPaid: Boolean(r.advance_paid),
        }));

        return NextResponse.json({ tenants });
    } catch (err) {
        console.error("Failed to fetch tenants:", err);
        return NextResponse.json(
            { error: "Failed to fetch tenants" },
            { status: 500 }
        );
    }
}
