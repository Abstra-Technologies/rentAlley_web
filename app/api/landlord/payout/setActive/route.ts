import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const { landlord_id, payout_id, otp } = await req.json();

        if (!landlord_id || !payout_id || !otp) {
            return NextResponse.json(
                { error: "landlord_id, payout_id and otp are required" },
                { status: 400 }
            );
        }

        const hashedOtp = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        connection = await db.getConnection();
        await connection.beginTransaction();

        /* ================= GET OTP ================= */
        const [rows]: any = await connection.query(
            `
            SELECT * FROM PayoutOTP
            WHERE landlord_id = ?
              AND payout_id = ?
              AND expires_at > NOW()
              AND verified_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [landlord_id, payout_id]
        );

        if (rows.length === 0) {
            throw new Error("OTP expired or not found");
        }

        const otpRecord = rows[0];

        /* ================= CHECK ATTEMPTS ================= */
        if (otpRecord.attempts >= otpRecord.max_attempts) {
            throw new Error("OTP locked due to too many attempts");
        }

        /* ================= VERIFY HASH ================= */
        if (otpRecord.otp_hash !== hashedOtp) {
            await connection.query(
                `
                UPDATE PayoutOTP
                SET attempts = attempts + 1
                WHERE otp_id = ?
                `,
                [otpRecord.otp_id]
            );

            throw new Error("Invalid OTP");
        }

        /* ================= MARK VERIFIED ================= */
        await connection.query(
            `
            UPDATE PayoutOTP
            SET verified_at = NOW()
            WHERE otp_id = ?
            `,
            [otpRecord.otp_id]
        );

        /* ================= ACTIVATE PAYOUT ================= */
        await connection.query(
            `
            UPDATE LandlordPayoutAccount
            SET is_active = 0,
                updated_at = NOW()
            WHERE landlord_id = ?
            `,
            [landlord_id]
        );

        const [result]: any = await connection.query(
            `
            UPDATE LandlordPayoutAccount
            SET is_active = 1,
                updated_at = NOW()
            WHERE payout_id = ?
              AND landlord_id = ?
            `,
            [payout_id, landlord_id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Payout account not found");
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Payout account activated successfully.",
        });

    } catch (error: any) {
        if (connection) await connection.rollback();

        console.error("verifyOtpAndActivate error:", error.message);

        return NextResponse.json(
            { error: error.message || "OTP verification failed" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
