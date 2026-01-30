import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ===============================
   Debug helper
================================ */
const log = (stage: string, data?: any) => {
    console.log(`[EKYP STATUS ${stage}]`, data ?? "");
};

export async function GET(req: Request) {
    try {
        log("START");

        const { searchParams } = new URL(req.url);
        const agreement_id = searchParams.get("agreement_id");

        log("AGREEMENT_ID", agreement_id);

        if (!agreement_id) {
            return NextResponse.json(
                { message: "agreement_id is required" },
                { status: 400 }
            );
        }

        /* ===============================
           Fetch eKYP record (mysql2-safe)
        ================================ */
        const [rows]: any[] = await db.query(
            `
            SELECT 
                ek.status,
                ek.qr_hash,
                ek.issued_at
            FROM rentalley_db.LeaseEKyp ek
            WHERE ek.agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        const ekyp = rows?.[0];

        if (!ekyp) {
            log("NOT_FOUND");
            return NextResponse.json({
                exists: false,
                status: "draft",
                qr_url: null,
            });
        }

        const qrUrl =
            ekyp.qr_hash
                ? `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/ekypid/${agreement_id}/${ekyp.qr_hash}.png`
                : null;

        log("FOUND", ekyp.status);

        return NextResponse.json({
            exists: true,
            status: ekyp.status, // draft | active | revoked
            qr_url: qrUrl,
            issued_at: ekyp.issued_at,
        });
    } catch (err) {
        console.error("[EKYP STATUS ERROR]", err);
        return NextResponse.json(
            { message: "Failed to fetch eKYP status" },
            { status: 500 }
        );
    }
}
