import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import moment from "moment-timezone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ✅ POST /api/tenant/activeLease/verifyOtp
 * Body: { agreement_id: string, role: "tenant", email: string, otp_code: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agreement_id, role, email, otp_code } = body;

        // 🔹 Validate input
        if (!agreement_id || !role || !email || !otp_code) {
            return NextResponse.json(
                { error: "Missing required fields (agreement_id, role, email, otp_code)." },
                { status: 400 }
            );
        }

        // 🔹 Fetch OTP record for this lease and tenant
        const [rows]: any = await db.query(
            `
      SELECT id, otp_code, otp_expires_at, status
      FROM LeaseSignature
      WHERE agreement_id = ? AND role = 'tenant' AND email = ?
      LIMIT 1;
      `,
            [agreement_id, email]
        );

        if (!rows?.length) {
            return NextResponse.json(
                { error: "No OTP record found for this tenant and lease." },
                { status: 404 }
            );
        }

        const record = rows[0];

        // 🔹 Check if already signed
        if (record.status === "signed") {
            return NextResponse.json({
                success: true,
                message: "Lease already signed by tenant.",
            });
        }

        // 🔹 Check OTP validity
        const nowUTC = moment.utc();
        const expiryUTC = moment(record.otp_expires_at);

        if (!record.otp_code || record.otp_code !== otp_code) {
            return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
        }

        if (nowUTC.isAfter(expiryUTC)) {
            return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
        }

        // 🔹 Mark as signed
        await db.query(
            `
      UPDATE LeaseSignature
      SET status = 'signed', signed_at = UTC_TIMESTAMP(), otp_code = NULL
      WHERE id = ?;
      `,
            [record.id]
        );

        // 🔹 Optionally check if landlord also signed → mark lease as "active"
        const [signatures]: any = await db.query(
            `
      SELECT COUNT(*) AS signed_count
      FROM LeaseSignature
      WHERE agreement_id = ? AND status = 'signed';
      `,
            [agreement_id]
        );

        if (signatures?.[0]?.signed_count >= 2) {
            await db.query(
                `
        UPDATE LeaseAgreement
        SET status = 'active', signed_at = UTC_TIMESTAMP()
        WHERE agreement_id = ?;
        `,
                [agreement_id]
            );
        }

        return NextResponse.json({
            success: true,
            message: "OTP verified and lease signed successfully.",
        });
    } catch (error: any) {
        console.error("❌ Tenant verifyOtp error:", error);
        return NextResponse.json(
            { error: "Failed to verify OTP. " + (error.message || "") },
            { status: 500 }
        );
    }
}
