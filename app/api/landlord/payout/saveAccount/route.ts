import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

/* ============================================================
   USED ONLY FOR INITIAL SETUP OF LANDLORDS
============================================================ */

const XENDIT_BASE_URL = "https://api.xendit.co/v2/accounts";
const XENDIT_SECRET_KEY = process.env.XENDIT_SUB_ACCOUNT_KEY as string;

if (!XENDIT_SECRET_KEY) {
    throw new Error("XENDIT_SECRET_KEY is not defined in environment variables.");
}

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        console.log("===== CREATE SUB ACCOUNT START =====");

        const body = await req.json();

        const {
            landlord_id,
            business_email,
            channel_code,
            account_name,
            account_number,
            bank_name,
        } = body;

        console.log("Incoming body:", body);

        /* ================= VALIDATION ================= */

        if (
            !landlord_id ||
            !business_email ||
            !channel_code ||
            !account_name ||
            !account_number
        ) {
            console.log("❌ Validation failed");
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        console.log("🔎 Fetching user info...");

        /* ================= FETCH USER INFO ================= */

        const [rows]: any = await connection.query(
            `
            SELECT 
                u.firstName,
                u.lastName,
                u.companyName
            FROM Landlord l
            JOIN User u ON l.user_id = u.user_id
            WHERE l.landlord_id = ?
            LIMIT 1
            `,
            [landlord_id]
        );

        if (rows.length === 0) {
            throw new Error("Landlord not found.");
        }

        const encryptedFirstName = rows[0].firstName;
        const encryptedLastName = rows[0].lastName;
        const companyName = rows[0].companyName;

        console.log("Encrypted First:", encryptedFirstName);
        console.log("Encrypted Last:", encryptedLastName);
        console.log("Company Name:", companyName);

        /* ================= DECRYPT ================= */

        const decryptedFirstName =
            safeDecrypt(encryptedFirstName) || "";

        const decryptedLastName =
            safeDecrypt(encryptedLastName) || "";

        console.log("Decrypted First:", decryptedFirstName);
        console.log("Decrypted Last:", decryptedLastName);

        /* ================= BUSINESS NAME ================= */

        let businessName = "";

        if (companyName && companyName.trim() !== "") {
            businessName = companyName.trim();
        } else {
            businessName = `${decryptedFirstName} ${decryptedLastName}`.trim();
        }

        console.log("Final Business Name:", businessName);

        if (!businessName) {
            throw new Error("Unable to determine business name.");
        }

        /* ================= CREATE XENDIT ACCOUNT ================= */

        console.log("📡 Sending request to Xendit...");

        const xenditPayload = {
            email: business_email,
            type: "OWNED",
            public_profile: {
                business_name: businessName,
                business_type: "INDIVIDUAL",
            },
        };

        console.log("Xendit Payload:", xenditPayload);

        const xenditResponse = await axios.post(
            XENDIT_BASE_URL,
            xenditPayload,
            {
                auth: {
                    username: XENDIT_SECRET_KEY,
                    password: "",
                },
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Xendit Response:", xenditResponse.data);

        const xenditAccountId = xenditResponse.data.id;

        if (!xenditAccountId) {
            throw new Error("Failed to create Xendit account.");
        }

        console.log("💾 Saving payout account...");

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

        console.log("===== CREATE SUB ACCOUNT SUCCESS =====");

        return NextResponse.json(
            {
                success: true,
                xendit_account_id: xenditAccountId,
            },
            { status: 201 }
        );

    } catch (error: any) {
        if (connection) await connection.rollback();

        console.error("===== CREATE SUB ACCOUNT ERROR =====");

        console.error("Message:", error.message);
        console.error("Stack:", error.stack);

        if (error.response) {
            console.error("Xendit Status:", error.response.status);
            console.error("Xendit Headers:", error.response.headers);
            console.error("Xendit Data:", error.response.data);
        }

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
