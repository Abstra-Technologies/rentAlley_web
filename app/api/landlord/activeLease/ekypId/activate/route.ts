import { NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";

/* ===============================
   Debug helper
================================ */
const log = (stage: string, data?: any) => {
    console.log(`[EKYP ${stage}]`, data ?? "");
};

export async function POST(req: Request) {
    try {
        log("0-START");

        /* ===============================
           0. Parse & validate input
        ================================ */
        const body = await req.json();

        const agreement_id: string | undefined =
            body.agreement_id || body.lease_id;


        if (!agreement_id) {
            return NextResponse.json(
                { message: "agreement_id is required" },
                { status: 400 }
            );
        }

        /* ===============================
           1. Fetch lease (MYSQL2-SAFE)
        ================================ */

        const [rows]: any[] = await db.query(
            `
            SELECT 
                la.agreement_id,
                la.tenant_id,
                la.unit_id,
                la.status,
                p.landlord_id
            FROM rentalley_db.LeaseAgreement la
            JOIN rentalley_db.Unit u 
                ON u.unit_id = la.unit_id
            JOIN rentalley_db.Property p 
                ON p.property_id = u.property_id
            WHERE la.agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );


        const lease = rows?.[0];

        if (!lease) {
            log("1-ERROR", "Lease not found");
            return NextResponse.json(
                { message: "Lease not found" },
                { status: 404 }
            );
        }

        if (!lease.tenant_id) {
            log("1-ERROR", "Tenant not assigned");
            return NextResponse.json(
                {
                    message: "Cannot activate eKYP: tenant not assigned",
                    reason: "TENANT_NOT_ASSIGNED",
                },
                { status: 400 }
            );
        }

        if (!["active", "expired"].includes(lease.status)) {
            log("1-ERROR", `Invalid lease status: ${lease.status}`);
            return NextResponse.json(
                {
                    message: "Cannot activate eKYP: lease is not active or expired",
                    reason: "LEASE_NOT_ACTIVE",
                },
                { status: 400 }
            );
        }


        /* ===============================
           2. Build QR payload
        ================================ */

        const payload = {
            type: "LEASE_EKYP",
            agreement_id: lease.agreement_id,
            tenant_id: lease.tenant_id,
            unit_id: lease.unit_id,
            landlord_id: lease.landlord_id,
            issued_at: new Date().toISOString(),
        };

        const payloadString = JSON.stringify(payload);

        /* ===============================
           3. Hash payload
        ================================ */

        const qrHash = crypto
            .createHash("sha256")
            .update(payloadString)
            .digest("hex");

        log("3-HASH-VALUE", qrHash.slice(0, 12) + "...");

        /* ===============================
           4. Generate QR PNG
        ================================ */
        log("4-GENERATE-QR");

        const qrBuffer = await QRCode.toBuffer(payloadString, {
            type: "png",
            width: 512,
            margin: 2,
            errorCorrectionLevel: "M",
        });

        log("4-QR-BUFFER-SIZE", qrBuffer.length);

        /* ===============================
           5. Upload QR to S3
        ================================ */
        const s3Key = `ekypid/${agreement_id}/${qrHash}.png`;

        const qrUrl = await uploadToS3(
            qrBuffer,
            s3Key,
            "image/png"
        );

        log("5-S3-URL", qrUrl);

        /* ===============================
           6. Upsert LeaseEKyp
        ================================ */

        await db.query(
            `
            INSERT INTO LeaseEKyp (
                ekyp_id,
                agreement_id,
                tenant_id,
                unit_id,
                landlord_id,
                qr_payload,
                qr_hash,
                status,
                issued_at
            )
            VALUES (
                UUID(),
                ?, ?, ?, ?,
                ?, ?, 'active', NOW()
            )
            ON DUPLICATE KEY UPDATE
                qr_payload = VALUES(qr_payload),
                qr_hash = VALUES(qr_hash),
                status = 'active',
                issued_at = NOW(),
                revoked_at = NULL
            `,
            [
                agreement_id,
                lease.tenant_id,
                lease.unit_id,
                lease.landlord_id,
                payloadString,
                qrHash,
            ]
        );


        /* ===============================
           7. Success
        ================================ */

        return NextResponse.json({
            success: true,
            agreement_id,
            qr_hash: qrHash,
            qr_url: qrUrl,
            status: "active",
        });
    } catch (err) {
        console.error("[EKYP FATAL ERROR]", err);
        return NextResponse.json(
            { message: "Failed to activate eKYP ID" },
            { status: 500 }
        );
    }
}
