import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { db } from "@/lib/db";

/* ---------------------------------
   Helpers
---------------------------------- */
function normalizeAccountNumber(value: string | null) {
    return value?.trim() || "";
}

export async function POST(req: NextRequest) {
    console.log("🚀 [DISBURSE] API HIT");

    try {
        const body = await req.json();
        const { payment_ids } = body;

        if (!Array.isArray(payment_ids) || payment_ids.length === 0) {
            return NextResponse.json(
                { error: "payment_ids is required" },
                { status: 400 }
            );
        }

        /* =====================================
           1. Fetch VALID payments
              + ACTIVE payout account
              + AVAILABLE payout channel
        ====================================== */
        const [rows]: any = await db.query(
            `
            SELECT
                p.payment_id,
                p.amount_paid,

                l.landlord_id,

                pa.channel_code,
                pa.account_name,
                pa.account_number,
                pa.bank_name,

                pc.channel_type

            FROM Payment p
            INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
            INNER JOIN Unit u ON la.unit_id = u.unit_id
            INNER JOIN Property pr ON pr.property_id = u.property_id
            INNER JOIN Landlord l ON l.landlord_id = pr.landlord_id

            INNER JOIN LandlordPayoutAccount pa
                ON pa.landlord_id = l.landlord_id
               AND pa.is_active = 1

            INNER JOIN payout_channels pc
                ON pc.channel_code = pa.channel_code
               AND pc.is_available = 1

            WHERE p.payment_id IN (?)
              AND p.payment_status = 'confirmed'
              AND p.payout_status = 'unpaid'
            `,
            [payment_ids]
        );

        console.log("📊 [DISBURSE] DB ROWS:", rows);

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "No valid payments found for disbursement" },
                { status: 400 }
            );
        }

        /* =====================================
           2. Group payments by LANDLORD (string key)
        ====================================== */
        const grouped: Record<string, any> = {};

        for (const row of rows) {
            const landlordId = row.landlord_id;

            if (!grouped[landlordId]) {
                grouped[landlordId] = {
                    landlord_id: landlordId,
                    channel_code: row.channel_code,
                    channel_type: row.channel_type, // BANK | EWALLET
                    account_name: row.account_name,
                    account_number: normalizeAccountNumber(row.account_number),
                    bank_name: row.bank_name,
                    payment_ids: [],
                    total_amount: 0,
                };
            }

            grouped[landlordId].payment_ids.push(row.payment_id);
            grouped[landlordId].total_amount += Number(row.amount_paid);
        }

        console.log("🧮 [DISBURSE] GROUPED PAYOUTS:", grouped);

        /* =====================================
           3. Disburse PER landlord (v2/payouts)
        ====================================== */
        for (const landlordKey of Object.keys(grouped)) {
            const payout = grouped[landlordKey]; // ✅ string-safe

            if (!payout || payout.total_amount <= 0) {
                console.error("❌ Invalid payout group:", payout);
                continue;
            }

            const amount = Number(payout.total_amount.toFixed(2));
            const external_id = `payout-${Date.now()}-${payout.landlord_id}`;

            if (amount < 50) {
                return NextResponse.json(
                    { error: `Minimum payout is ₱50 (₱${amount})` },
                    { status: 400 }
                );
            }

            /* ---------- XENDIT PAYOUTS v2 (BANK + EWALLET) ---------- */
            const payoutPayload = {
                reference_id: external_id,
                channel_code: payout.channel_code,
                channel_properties: {
                    account_number: payout.account_number,
                    account_holder_name: payout.account_name,
                },
                amount,
                description: "Rental payout",
                currency: "PHP",
                metadata: {
                    landlord_id: payout.landlord_id,
                    payment_ids: payout.payment_ids,
                },
            };

            console.log("📤 [XENDIT PAYOUT v2] PAYLOAD:", payoutPayload);

            const xenditResponse = await axios.post(
                "https://api.xendit.co/v2/payouts",
                payoutPayload,
                {
                    headers: {
                        "Idempotency-key": external_id,
                    },
                    auth: {
                        username: process.env.XENDIT_DISBURSE_SECRET_KEY!,
                        password: "",
                    },
                }
            );

            /* =====================================
               4. Save payout history (Xendit-aligned)
            ====================================== */
            await db.query(
                `
                INSERT INTO LandlordPayoutHistory
                (
                    landlord_id,
                    amount,
                    included_payments,
                    payout_method,
                    channel_code,
                    account_name,
                    account_number,
                    bank_name,
                    status,
                    external_id,
                    xendit_disbursement_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACCEPTED', ?, ?)
                `,
                [
                    payout.landlord_id,
                    amount,
                    JSON.stringify(payout.payment_ids),
                    payout.channel_type,
                    payout.channel_code,
                    payout.account_name,
                    payout.account_number,
                    payout.bank_name,
                    external_id,
                    xenditResponse?.data?.id || null,
                ]
            );

            /* =====================================
               5. Mark payments as IN_PAYOUT
            ====================================== */
            await db.query(
                `
                UPDATE Payment
                SET payout_status = 'in_payout'
                WHERE payment_id IN (?)
                `,
                [payout.payment_ids]
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Disbursement initiated successfully",
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("🔥 [DISBURSE] ERROR:", err?.response?.data || err);
        return NextResponse.json(
            {
                error: "Failed to initiate disbursement",
                details: err?.response?.data || err,
            },
            { status: 500 }
        );
    }
}
