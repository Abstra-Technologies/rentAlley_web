import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { randomUUID } from "crypto";
import { encryptData } from "@/crypto/encrypt";
import { generateLeaseId } from "@/utils/id_generator";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                { error: "Invalid Content-Type. Use multipart/form-data" },
                { status: 400 }
            );
        }

        const formData = await req.formData();

        let agreement_id = formData.get("agreement_id")?.toString();
        const property_id = formData.get("property_id")?.toString();
        const tenant_id = formData.get("tenant_id")?.toString();
        const start_date = formData.get("start_date")?.toString();
        const end_date = formData.get("end_date")?.toString();
        const rent_amount = formData.get("rent_amount")?.toString();
        const security_deposit = formData.get("security_deposit")?.toString();
        const advance_payment = formData.get("advance_payment")?.toString();
        const lease_file = formData.get("lease_file") as File | null;

        if (!agreement_id || agreement_id.trim() === "") {
            agreement_id = generateLeaseId();
        }

        if (!lease_file) {
            return NextResponse.json(
                { error: "Missing required field: lease_file" },
                { status: 400 }
            );
        }

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(lease_file.type)) {
            return NextResponse.json(
                { error: "Only PDF or DOCX files are allowed." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await lease_file.arrayBuffer());
        const ext = lease_file.name.split(".").pop();
        const prefix = process.env.NEXT_S3_LEASE_PREFIX || "lease_agreements";
        const key = `${prefix}/${agreement_id}_${randomUUID()}.${ext}`;

        const s3Url = await uploadToS3(buffer, key, lease_file.type);

        const encryptedUrl = JSON.stringify(
            encryptData(s3Url, SECRET_KEY)
        );

        /* --------------------------------------------------
         * UPSERT LEASE AGREEMENT
         * -------------------------------------------------- */
        const [existing]: any = await db.query(
            `SELECT agreement_id FROM LeaseAgreement WHERE agreement_id = ?`,
            [agreement_id]
        );

        if (existing.length > 0) {
            await db.query(
                `
                UPDATE LeaseAgreement
                SET agreement_url = ?, start_date = ?, end_date = ?,
                    security_deposit_amount = ?, advance_payment_amount = ?,
                    rent_amount = ?, status = 'active', updated_at = NOW()
                WHERE agreement_id = ?
                `,
                [
                    encryptedUrl,
                    start_date,
                    end_date,
                    security_deposit,
                    advance_payment,
                    rent_amount,
                    agreement_id,
                ]
            );
        } else {
            await db.query(
                `
                INSERT INTO LeaseAgreement
                (agreement_id, tenant_id, unit_id, start_date, end_date,
                 security_deposit_amount, advance_payment_amount, rent_amount,
                 agreement_url, status, created_at, updated_at)
                VALUES (?, ?, 
                    (SELECT unit_id FROM Unit WHERE property_id = ? LIMIT 1),
                    ?, ?, ?, ?, ?, ?, 'landlord_signed', NOW(), NOW())
                `,
                [
                    agreement_id,
                    tenant_id,
                    property_id,
                    start_date,
                    end_date,
                    security_deposit,
                    advance_payment,
                    rent_amount,
                    encryptedUrl,
                ]
            );
        }

        /* --------------------------------------------------
         * NOTIFY TENANT (DB + WEB PUSH)
         * -------------------------------------------------- */
        const [tenantUser]: any = await db.query(
            `
            SELECT u.user_id
            FROM Tenant t
            JOIN User u ON t.user_id = u.user_id
            WHERE t.tenant_id = ?
            `,
            [tenant_id]
        );

        if (tenantUser?.length) {
            await sendUserNotification({
                userId: tenantUser[0].user_id,
                title: "Lease Agreement Uploaded",
                body: "Your landlord has uploaded the lease agreement. Please review and sign.",
                url: `/pages/tenant/lease/view/${agreement_id}`,
            });
        }

        return NextResponse.json(
            {
                message:
                    existing.length > 0
                        ? "Lease updated successfully."
                        : "Lease created successfully.",
                agreement_id,
                agreement_url: s3Url,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Lease Document Upload Error:", error);
        return NextResponse.json(
            { error: "Failed to upload lease document." },
            { status: 500 }
        );
    }
}
