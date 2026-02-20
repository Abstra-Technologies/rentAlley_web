import { db } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";
import { decryptData } from "@/crypto/encrypt";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.ENCRYPTION_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
    try {
        /* ================= AUTH ================= */
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );

        if (!payload?.admin_id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const adminId = payload.admin_id;

        /* ================= BODY ================= */
        const { landlord_id, status, message } = await req.json();

        if (!landlord_id || !status) {
            return NextResponse.json(
                { message: "Missing landlord_id or status" },
                { status: 400 }
            );
        }

        /* ================= FETCH DATA ================= */
        const [rows] = await db.execute<any[]>(
            `
      SELECT
        lv.id,
        lv.document_url,
        lv.selfie_url,
        l.user_id
      FROM LandlordVerification lv
      JOIN Landlord l ON lv.landlord_id = l.landlord_id
      WHERE lv.landlord_id = ?
      ORDER BY lv.created_at DESC
      LIMIT 1
      `,
            [landlord_id]
        );

        if (!rows.length) {
            return NextResponse.json(
                { message: "Verification record not found" },
                { status: 404 }
            );
        }

        const { user_id, document_url, selfie_url } = rows[0];

        /* ================= REJECT ================= */
        if (status === "rejected") {
            // 🔥 decrypt URLs before S3 delete
            if (document_url) {
                const url = decryptData(JSON.parse(document_url), SECRET);
                await deleteFromS3(url);
            }

            if (selfie_url) {
                const url = decryptData(JSON.parse(selfie_url), SECRET);
                await deleteFromS3(url);
            }

            await db.execute(
                `
        UPDATE LandlordVerification
        SET status = 'rejected',
            reviewed_by = ?,
            review_date = NOW(),
            message = ?
        WHERE landlord_id = ?
        `,
                [adminId, message ?? null, landlord_id]
            );

            await db.execute(
                `UPDATE Landlord SET is_verified = 0 WHERE landlord_id = ?`,
                [landlord_id]
            );

            await db.execute(
                `
        INSERT INTO Notification (user_id, title, body, is_read, created_at)
        VALUES (?, ?, ?, 0, NOW())
        `,
                [
                    user_id,
                    "Landlord Verification Rejected",
                    message
                        ? `Your verification was rejected: ${message}`
                        : "Your verification was rejected. Please resubmit.",
                ]
            );

            return NextResponse.json({ message: "Verification rejected." });
        }

        /* ================= APPROVE / PENDING ================= */
        await db.execute(
            `
      UPDATE LandlordVerification
      SET status = ?, reviewed_by = ?, review_date = NOW(), message = ?
      WHERE landlord_id = ?
      `,
            [status, adminId, message ?? null, landlord_id]
        );

        await db.execute(
            `UPDATE Landlord SET is_verified = ? WHERE landlord_id = ?`,
            [status === "approved" ? 1 : 0, landlord_id]
        );

        await db.execute(
            `
      INSERT INTO Notification (user_id, title, body, is_read, created_at)
      VALUES (?, ?, ?, 0, NOW())
      `,
            [
                user_id,
                `Landlord Verification ${status}`,
                `Your landlord verification was ${status.toUpperCase()}.`,
            ]
        );

        return NextResponse.json({ message: `Verification ${status}.` });
    } catch (error) {
        console.error("[ADMIN VERIFY LANDLORD]", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
