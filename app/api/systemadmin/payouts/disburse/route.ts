import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { db } from "@/lib/db";

/* ---------------------------------
   Helpers
---------------------------------- */
function normalizeAccountNumber(value: string) {
    return value?.trim();
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
           1. Fetch eligible payments
              + ACTIVE payout account only
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
                pa.is_active,

                pc.channel_type

            FROM Payment p
            INNER JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
            INNER JOIN Unit u ON la.unit_id = u.unit_id
            INNER JOIN Property pr ON pr.property_id = u.property_id
            INNER JOIN Landlord l ON l.landlord_id = pr.landlord_id

            /* ✅ ACTIVE payout account ONLY */
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

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "No valid payments found or landlord has no active payout account",
                },
                { status: 400 }
            );
        }

        /* =====================================
           2. Group payments by landlord
        ====================================== */
        const grouped: Record<number, any> = {};

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

        /* =====================================
           3. Process payout per landlord
        ====================================== */
        for (const landlordId of Object.keys(grouped)) {
            const payout = grouped[Number(landlordId)];

            const external_id = `payout-${Date.now()}-${landlordId}`;
            const amount = Number(payout.total_amount.toFixed(2));

            if (amount < 50) {
                return NextResponse.json(
                    { error: `Minimum payout is ₱50 (₱${amount})` },
                    { status: 400 }
                );
            }

            let xenditResponse: any;

            /* ---------- EWALLET (Payouts v2) ---------- */
            if (payout.channel_type === "EWALLET") {
                const walletPayload = {
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
                        landlord_id: landlordId,
                        payment_ids: payout.payment_ids,
                    },
                };

                console.log("📤 [XENDIT EWALLET] PAYLOAD:", walletPayload);

                xenditResponse = await axios.post(
                    "https://api.xendit.co/v2/payouts",
                    walletPayload,
                    {
                        headers: {
                            "Idempotency-key": external_id,
                        },
                        auth: {
                            username:
                                process.env.XENDIT_DISBURSE_SECRET_KEY!,
                            password: "",
                        },
                    }
                );
            }

            /* ---------- BANK (Disbursements) ---------- */
            else if (payout.channel_type === "BANK") {
                const bankPayload = {
                    external_id,
                    amount,
                    bank_code: payout.channel_code,
                    account_holder_name: payout.account_name,
                    account_number: payout.account_number,
                    description: "Rental payout",
                };

                console.log("📤 [XENDIT BANK] PAYLOAD:", bankPayload);

                xenditResponse = await axios.post(
                    "https://api.xendit.co/disbursements",
                    bankPayload,
                    {
                        auth: {
                            username:
                                process.env.XENDIT_DISBURSE_SECRET_KEY!,
                            password: "",
                        },
                    }
                );
            } else {
                throw new Error(
                    `Unsupported channel type: ${payout.channel_type}`
                );
            }

            /* =====================================
               4. Save payout history
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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?)
                `,
                [
                    landlordId,
                    payout.total_amount,
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
               5. Update payment payout status
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
                message:
                    "Disbursement initiated successfully (active payout accounts only)",
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
