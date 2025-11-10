import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { s3 } from "@/lib/s3";
import { randomUUID } from "crypto";
import { encryptData } from "@/crypto/encrypt";
import { generateLeaseId } from "@/utils/id_generator";
import webpush from "web-push";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

// ✅ Configure Web Push
webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

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
        const landlord_id = formData.get("landlord_id")?.toString();
        const start_date = formData.get("start_date")?.toString();
        const end_date = formData.get("end_date")?.toString();
        const rent_amount = formData.get("rent_amount")?.toString();
        const security_deposit = formData.get("security_deposit")?.toString();
        const advance_payment = formData.get("advance_payment")?.toString();
        const lease_file = formData.get("lease_file") as File | null;

        if (!agreement_id || agreement_id.trim() === "") {
            agreement_id = generateLeaseId();
            console.log("🆕 Generated new Lease ID:", agreement_id);
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

        const fileBuffer = Buffer.from(await lease_file.arrayBuffer());
        const fileExt = lease_file.name.split(".").pop();
        const fileKey = `leases/${agreement_id}_${randomUUID()}.${fileExt}`;

        await s3
            .upload({
                Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                Key: fileKey,
                Body: fileBuffer,
                ContentType: lease_file.type,
            })
            .promise();

        const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileKey}`;

        const encryptedUrlObj = encryptData(s3Url, SECRET_KEY);
        const encryptedUrlJson = JSON.stringify(encryptedUrlObj);

        const [existingLease]: any = await db.query(
            `SELECT agreement_id FROM LeaseAgreement WHERE agreement_id = ?`,
            [agreement_id]
        );

        if (existingLease.length > 0) {
            // ✅ Update existing record
            await db.query(
                `UPDATE LeaseAgreement 
         SET agreement_url = ?, start_date = ?, end_date = ?, 
             security_deposit_amount = ?, advance_payment_amount = ?, 
             rent_amount = ?, status = 'active', updated_at = NOW()
         WHERE agreement_id = ?`,
                [
                    encryptedUrlJson,
                    start_date,
                    end_date,
                    security_deposit,
                    advance_payment,
                    rent_amount,
                    agreement_id,
                ]
            );
        } else {
            // ✅ Insert new record
            await db.query(
                `INSERT INTO LeaseAgreement 
         (agreement_id, tenant_id, unit_id, start_date, end_date, 
          security_deposit_amount, advance_payment_amount, rent_amount, 
          agreement_url, status, created_at, updated_at)
         VALUES (?, ?, 
            (SELECT unit_id FROM Unit WHERE property_id = ? LIMIT 1),
            ?, ?, ?, ?, ?, ?, 'landlord_signed', NOW(), NOW())`,
                [
                    agreement_id,
                    tenant_id,
                    property_id,
                    start_date,
                    end_date,
                    security_deposit,
                    advance_payment,
                    rent_amount,
                    encryptedUrlJson,
                ]
            );
        }

        // ✅ Create in-app notification for tenant
        await db.query(
            `INSERT INTO Notification (user_id, title, body, url, created_at)
       SELECT u.user_id, ?, ?, ?, NOW()
       FROM Tenant t
       JOIN User u ON t.user_id = u.user_id
       WHERE t.tenant_id = ?`,
            [
                "Lease Agreement Uploaded",
                "Your landlord has uploaded the lease agreement. Please review and sign.",
                `/pages/tenant/lease/view/${agreement_id}`,
                tenant_id,
            ]
        );

        // ✅ Retrieve tenant push subscriptions
        const [subscriptions]: any = await db.query(
            `SELECT id, endpoint, p256dh, auth 
       FROM user_push_subscriptions 
       WHERE user_id = (SELECT user_id FROM Tenant WHERE tenant_id = ?)`,
            [tenant_id]
        );

        if (subscriptions.length > 0) {
            const notificationPayload = JSON.stringify({
                title: "Lease Agreement Uploaded",
                body: "Your landlord has uploaded the lease agreement. Please review and sign it.",
                icon: "/icons/lease.png",
                url: `/pages/tenant/lease/view/${agreement_id}`,
            });

            for (const sub of subscriptions) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        notificationPayload
                    );
                } catch (err: any) {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        console.warn("⚠️ Removing invalid subscription:", sub.endpoint);
                        await db.query(`DELETE FROM user_push_subscriptions WHERE id = ?`, [
                            sub.id,
                        ]);
                    } else {
                        console.error("❌ Push notification error:", err);
                    }
                }
            }
        }

        return NextResponse.json(
            {
                message:
                    existingLease.length > 0
                        ? "Existing lease updated, encrypted, and tenant notified."
                        : "New lease created, encrypted, and tenant notified.",
                agreement_id,
                agreement_url: s3Url,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Lease Document Upload Error:", error);
        return NextResponse.json(
            { error: "Failed to upload lease document or send notification." },
            { status: 500 }
        );
    }
}
