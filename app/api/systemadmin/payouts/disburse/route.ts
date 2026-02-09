import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { db } from "@/lib/db";

/**
 * Xendit channel routing
 * - PH_GCASH, PH_PAYMAYA → Payouts v2
 * - Others (BPI, BDO, UBP, etc.) → Disbursements
 */
const WALLET_CHANNELS = ["PH_GCASH", "PH_PAYMAYA"];

/* ---------------------------------
   Helpers
---------------------------------- */
function normalizePhoneNumber(phone: string) {
    if (!phone) return "";

    if (phone.startsWith("0")) return `+63${phone.slice(1)}`;
    if (phone.startsWith("63")) return `+${phone}`;
    return phone;
}

export async function POST(req: NextRequest) {
    console.log("🚀 [DISBURSE] API HIT");

    try {
        const body = await req.json();
        const { payment_ids } = body;

        console.log("📥 [DISBURSE] REQUEST BODY:", body);

        if (!Array.isArray(payment_ids) || payment_ids.length === 0) {
            console.error("❌ [DISBURSE] payment_ids missing");
            return NextResponse.json(
                { error: "payment_ids is required" },
                { status: 400 }
            );
        }

        /* =====================================
           1. Fetch eligible payments
        ====================================== */
        console.log("📡 [DISBURSE] Fetching payments from DB");

        const [rows]: any = await db.query(
            `
            SELECT
                p.payment_id,
                p.amount_paid,
                l.landlord_id,
                pa.channel_code,
                pa.account_name,
                pa.account_number,
                pa.bank_name
            FROM Payment p
            INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
            INNER JOIN Unit u ON la.unit_id = u.unit_id
            INNER JOIN Property pr ON pr.property_id = u.property_id
            INNER JOIN Landlord l ON l.landlord_id = pr.landlord_id
            INNER JOIN LandlordPayoutAccount pa ON pa.landlord_id = l.landlord_id
            WHERE p.payment_id IN (?)
              AND p.payment_status = 'confirmed'
              AND p.payout_status = 'unpaid'
            `,
            [payment_ids]
        );

        console.log("📊 [DISBURSE] DB RESULT:", rows);

        if (!rows || rows.length === 0) {
            console.error("❌ [DISBURSE] No eligible payments");
            return NextResponse.json(
                { error: "No valid payments found for disbursement" },
                { status: 400 }
            );
        }

        /* =====================================
           2. Group payments by landlord
        ====================================== */
        console.log("🧩 [DISBURSE] Grouping payments");

        const grouped: Record<string, any> = {};

        for (const row of rows) {
            const landlordId = row.landlord_id;

            if (!row.channel_code) {
                console.error("❌ [DISBURSE] Missing channel_code", landlordId);
                return NextResponse.json(
                    { error: `Missing channel_code for landlord ${landlordId}` },
                    { status: 400 }
                );
            }

            if (!grouped[landlordId]) {
                grouped[landlordId] = {
                    landlord_id: landlordId,
                    channel_code: row.channel_code.toUpperCase(),
                    account_name: row.account_name,
                    account_number: row.account_number,
                    bank_name: row.bank_name,
                    payment_ids: [],
                    total_amount: 0,
                };
            }

            grouped[landlordId].payment_ids.push(row.payment_id);
            grouped[landlordId].total_amount += Number(row.amount_paid);
        }

        console.log("🧩 [DISBURSE] GROUPED:", JSON.stringify(grouped, null, 2));

        /* =====================================
           3. Process disbursement per landlord
        ====================================== */
        for (const landlordId of Object.keys(grouped)) {
            const payout = grouped[landlordId];

            console.log("➡️ [DISBURSE] Processing landlord:", landlordId);
            console.log("➡️ [DISBURSE] Channel:", payout.channel_code);

            const external_id = `payout-${Date.now()}-${landlordId}`;
            const amount = Math.round(payout.total_amount);

            console.log("➡️ [DISBURSE] Amount:", amount);

            if (amount < 50) {
                console.error("❌ [DISBURSE] Below minimum amount");
                return NextResponse.json(
                    { error: `Minimum payout is ₱50 (₱${amount})` },
                    { status: 400 }
                );
            }

            let xenditResponse: any;

            /* -------- WALLET PAYOUT -------- */
            if (WALLET_CHANNELS.includes(payout.channel_code)) {
                const phone = normalizePhoneNumber(payout.account_number);

                const walletPayload = {
                    reference_id: external_id,
                    channel_code: payout.channel_code,
                    channel_properties: {
                        phone_number: phone,
                    },
                    amount,
                    currency: "PHP",
                };

                console.log("📤 [XENDIT WALLET] PAYLOAD:", walletPayload);

                try {
                    xenditResponse = await axios.post(
                        "https://api.xendit.co/payouts",
                        walletPayload,
                        {
                            auth: {
                                username: process.env.XENDIT_DISBURSE_SECRET_KEY!,
                                password: process.env.XENDIT_PASSWORD,
                            },
                        }
                    );
                    console.log("✅ [XENDIT WALLET] RESPONSE:", xenditResponse.data);
                } catch (err: any) {
                    console.error("❌ [XENDIT WALLET] ERROR:", err.response?.data || err);
                    throw err;
                }
            }

            /* -------- BANK PAYOUT -------- */
            else {
                const bankPayload = {
                    external_id,
                    amount,
                    bank_code: payout.channel_code,
                    account_holder_name: payout.account_name,
                    account_number: payout.account_number,
                    description: "Rental payout",
                };

                console.log("📤 [XENDIT BANK] PAYLOAD:", bankPayload);

                try {
                    xenditResponse = await axios.post(
                        "https://api.xendit.co/disbursements",
                        bankPayload,
                        {
                            auth: {
                                username: process.env.XENDIT_DISBURSE_SECRET_KEY!,
                                password: "",
                            },
                        }
                    );
                    console.log("✅ [XENDIT BANK] RESPONSE:", xenditResponse.data);
                } catch (err: any) {
                    console.error("❌ [XENDIT BANK] ERROR:", err.response?.data || err);
                    throw err;
                }
            }

            /* =====================================
               4. Save payout history
            ====================================== */
            console.log("📝 [DISBURSE] Saving payout history");

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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?)
                `,
                [
                    landlordId,
                    payout.total_amount,
                    JSON.stringify(payout.payment_ids),
                    payout.channel_code,
                    payout.channel_code,
                    payout.account_name,
                    payout.account_number,
                    payout.bank_name,
                    external_id,
                    xenditResponse?.data?.id || null,
                ]
            );

            /* =====================================
               5. Update payment status
            ====================================== */
            console.log("🔄 [DISBURSE] Updating payments:", payout.payment_ids);

            await db.query(
                `
                UPDATE Payment
                SET payout_status = 'in_payout'
                WHERE payment_id IN (?)
                `,
                [payout.payment_ids]
            );
        }

        console.log("🎉 [DISBURSE] SUCCESS");

        return NextResponse.json(
            { success: true, message: "Disbursement initiated successfully" },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("🔥 [DISBURSE] FATAL ERROR:", err?.response?.data || err);
        return NextResponse.json(
            {
                error: "Failed to initiate disbursement",
                details: err?.response?.data || err,
            },
            { status: 500 }
        );
    }
}
