import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";

/* ===============================
   Debug helper
================================ */
const log = (stage: string, data?: any) => {
    console.log(`[EKYP REVOKE ${stage}]`, data ?? "");
};

export async function POST(req: Request) {
    try {
        log("START");

        /* ===============================
           0. Parse input
        ================================ */
        const body = await req.json();
        const agreement_id: string | undefined =
            body.agreement_id || body.lease_id;

        log("AGREEMENT_ID", agreement_id);

        if (!agreement_id) {
            log("ERROR", "Missing agreement_id");
            return NextResponse.json(
                { message: "agreement_id is required" },
                { status: 400 }
            );
        }

        /* ===============================
           1. Fetch eKYP record (mysql2 safe)
        ================================ */
        const [rows]: any[] = await db.query(
            `
            SELECT 
                ek.ekyp_id,
                ek.qr_hash,
                ek.status
            FROM rentalley_db.LeaseEKyp ek
            WHERE ek.agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        log("RAW_ROWS", rows);

        const ekyp = rows?.[0];

        if (!ekyp) {
            log("NOT_FOUND");
            return NextResponse.json(
                { message: "No eKYP ID found for this lease" },
                { status: 404 }
            );
        }

        if (ekyp.status === "revoked") {
            log("ALREADY_REVOKED");
            return NextResponse.json({
                success: true,
                status: "revoked",
                message: "eKYP ID already revoked",
            });
        }

        /* ===============================
           2. Delete QR from S3 (best effort)
        ================================ */
        if (ekyp.qr_hash) {
            const s3Key = `ekypid/${agreement_id}/${ekyp.qr_hash}.png`;
            log("S3_DELETE", s3Key);

            try {
                await deleteFromS3(
                    `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${s3Key}`
                );
            } catch (err) {
                console.warn("[EKYP REVOKE] S3 delete failed (continuing)", err);
            }
        }

        /* ===============================
           3. Mark revoked in DB
        ================================ */
        log("DB_UPDATE");

        await db.query(
            `
            UPDATE rentalley_db.LeaseEKyp
            SET 
                status = 'revoked',
                revoked_at = NOW()
            WHERE agreement_id = ?
            `,
            [agreement_id]
        );

        log("SUCCESS");

        return NextResponse.json({
            success: true,
            status: "revoked",
        });
    } catch (err) {
        console.error("[EKYP REVOKE FATAL ERROR]", err);
        return NextResponse.json(
            { message: "Failed to revoke eKYP ID" },
            { status: 500 }
        );
    }
}
