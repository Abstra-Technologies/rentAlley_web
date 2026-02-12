import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";
import crypto from "crypto";

/* ================= CONSTANTS ================= */

const KUDOSITY_API_URL = process.env.KUDOSITY_API_URL; // keep your URL
const KUDOSITY_API_KEY = process.env.KUDOSITY_API_KEY;
const KUDOSITY_API_SECRET = process.env.KUDOSITY_SECRET_KEY;

if (!KUDOSITY_API_URL || !KUDOSITY_API_KEY || !KUDOSITY_API_SECRET) {
    throw new Error("KUDOSITY environment variables are missing.");
}

/* ================= HELPERS ================= */

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePHPhone(phone: string) {
    if (!phone) return "";
    phone = phone.trim();

    if (phone.startsWith("+63")) return phone;
    if (phone.startsWith("09")) return "+63" + phone.substring(1);
    if (phone.startsWith("9") && phone.length === 10) return "+63" + phone;

    return phone;
}

/* ================= ROUTE ================= */

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const { landlord_id, payout_id, phone_number } = await req.json();

        if (!landlord_id || !payout_id || !phone_number) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const normalizedPhone = normalizePHPhone(phone_number);

        const otp = generateOTP();

        const hashedOtp = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        connection = await db.getConnection();

        /* ================= SAVE OTP ================= */

        await connection.query(
            `
            INSERT INTO PayoutOTP
            (landlord_id, payout_id, otp_hash, expires_at, created_at)
            VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), NOW())
            `,
            [landlord_id, payout_id, hashedOtp]
        );

        /* ================= MESSAGE ================= */

        const message = `Upkyp Security Notice:

You requested to change your active payout account.

OTP: ${otp}

This code expires in 5 minutes.`;

        /* ================= SEND SMS ================= */

        const smsResponse = await axios.post(
            KUDOSITY_API_URL,   // keeping your URL
            {
                message: message,
                to: normalizedPhone,
                from: "Upkyp"
            },
            {
                auth: {
                    username: KUDOSITY_API_KEY,
                    password: KUDOSITY_API_SECRET,
                },
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            }
        );

        console.log("SMS Response:", smsResponse.data);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("OTP request error FULL:", {
            message: error.message,
            response: error.response?.data,
        });

        return NextResponse.json(
            {
                error:
                    error.response?.data?.error ||
                    error.message ||
                    "Failed to send OTP",
            },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
