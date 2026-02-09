import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

async function safeDecrypt(value: string | null) {
    try {
        if (value && value.startsWith("{")) {
            return decryptData(
                JSON.parse(value),
                process.env.ENCRYPTION_SECRET!
            );
        }
        return value ?? "";
    } catch {
        return "";
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const paymentIdsParam = searchParams.get("payment_ids");

        if (!paymentIdsParam) {
            return NextResponse.json(
                { error: "payment_ids is required" },
                { status: 400 }
            );
        }

        const paymentIds = paymentIdsParam.split(",");

        if (paymentIds.length === 0) {
            return NextResponse.json({ landlords: [] });
        }

        /* ===============================
           FETCH PAYMENTS FOR REVIEW
        ================================ */
        const sql = `
      SELECT
        p.payment_id,
        p.payment_type,
        p.net_amount,

        -- Landlord
        l.landlord_id,
        u_landlord.firstName AS landlord_firstName,
        u_landlord.lastName AS landlord_lastName,

        -- Payout account
        pa.payout_method,
        pa.account_name,
        pa.account_number,
        pa.bank_name

      FROM Payment p
      INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
      INNER JOIN Unit u ON la.unit_id = u.unit_id
      INNER JOIN Property pr ON pr.property_id = u.property_id
      INNER JOIN Landlord l ON l.landlord_id = pr.landlord_id
      INNER JOIN User u_landlord ON l.user_id = u_landlord.user_id
      INNER JOIN LandlordPayoutAccount pa ON pa.landlord_id = l.landlord_id

      WHERE p.payment_id IN (?)
        AND p.payment_status = 'confirmed'
        AND p.payout_status = 'unpaid'
        AND p.net_amount IS NOT NULL
    `;

        const [rows]: any = await db.query(sql, [paymentIds]);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ landlords: [] });
        }

        /* ===============================
           GROUP BY LANDLORD (NET AMOUNT)
        ================================ */
        const grouped: Record<string, any> = {};

        for (const row of rows) {
            const landlordId = row.landlord_id;

            if (!grouped[landlordId]) {
                const first = await safeDecrypt(row.landlord_firstName);
                const last = await safeDecrypt(row.landlord_lastName);

                grouped[landlordId] = {
                    landlord_id: landlordId,
                    landlord_name: `${first} ${last}`.trim(),

                    payout_method: row.payout_method,
                    account_name: row.account_name,
                    account_number: row.account_number,
                    bank_name: row.bank_name ?? "",

                    total_amount: 0, // NET TOTAL
                    payments: [],
                };
            }

            grouped[landlordId].payments.push({
                payment_id: row.payment_id,
                payment_type: row.payment_type,
                net_amount: Number(row.net_amount),
            });

            grouped[landlordId].total_amount += Number(row.net_amount);
        }

        return NextResponse.json(
            {
                success: true,
                landlords: Object.values(grouped),
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error in payouts/review:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
