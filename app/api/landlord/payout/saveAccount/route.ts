import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";

/* ============================================================
   USED ONLY FOR INITIAL SETUP OF LANDLORDS
============================================================ */

const XENDIT_BASE_URL = "https://api.xendit.co/v2/accounts";
const XENDIT_SECRET_KEY = process.env.XENDIT_SUB_ACCOUNT_KEY as string;

if (!XENDIT_SECRET_KEY) {
    throw new Error("XENDIT_SECRET_KEY is not defined in environment variables.");
}

/* ============================================================
   CREATE LANDLORD MANAGED ACCOUNT + SAVE PAYOUT
============================================================ */

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const body = await req.json();

        const {
            landlord_id,
            email,
            business_name,
            channel_code,
            account_name,
            account_number,
            bank_name,
        } = body;

        /* ================= VALIDATION ================= */

        if (
            !landlord_id ||
            !email ||
            !business_name ||
            !channel_code ||
            !account_name ||
            !account_number
        ) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        /* ================= CREATE XENDIT MANAGED ACCOUNT ================= */

        const xenditResponse = await axios.post(
            XENDIT_BASE_URL,
            {
                email: email,
                type: "MANAGED",
                business_profile: {
                    business_name: business_name,
                    business_type: "INDIVIDUAL",
                },
            },
            {
                auth: {
                    username: XENDIT_SECRET_KEY,
                    password: "",
                },
            }
        );

        const xenditAccountId = xenditResponse.data.id;

        if (!xenditAccountId) {
            throw new Error("Failed to create Xendit account.");
        }

        /* ================= SAVE PAYOUT ACCOUNT ================= */

        await connection.query(
            `
            INSERT INTO LandlordPayoutAccount
            (
                landlord_id,
                xendit_account_id,
                channel_code,
                account_name,
                account_number,
                bank_name,
                is_active,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
            `,
            [
                landlord_id,
                xenditAccountId,
                channel_code,
                account_name,
                account_number,
                bank_name || null,
            ]
        );

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                message: "Managed account created and payout account saved.",
                xendit_account_id: xenditAccountId,
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error(
            "Create payout error:",
            error.response?.data || error.message || error
        );

        if (connection) await connection.rollback();

        return NextResponse.json(
            {
                error: "Failed to create managed account and payout.",
                details: error.response?.data || error.message,
            },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
