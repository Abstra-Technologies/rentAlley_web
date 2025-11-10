import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMaintenanceId } from "@/utils/id_generator";
import { encryptData } from "@/crypto/encrypt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import webpush from "web-push";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                { error: "Invalid Content-Type. Use multipart/form-data" },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const agreement_id = formData.get("agreement_id")?.toString();
        const description = formData.get("description")?.toString();
        const category = formData.get("category")?.toString();
        const is_emergency = formData.get("is_emergency") === "1" ? 1 : 0;


        if (!agreement_id || !category || !description) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const files: File[] = [];
        for (const [, value] of formData.entries()) {
            if (value instanceof File) files.push(value);
        }

        await connection.beginTransaction();

        // --- Get active lease details ---
        const [agreementRows]: any = await connection.execute(
            `
        SELECT la.tenant_id, la.unit_id, u.property_id
        FROM LeaseAgreement la
        JOIN Unit u ON la.unit_id = u.unit_id
        WHERE la.agreement_id = ? AND la.status = 'active'
      `,
            [agreement_id]
        );

        if (!agreementRows.length) {
            await connection.rollback();
            return NextResponse.json(
                { error: "No active lease found for agreement" },
                { status: 404 }
            );
        }

        const { tenant_id, unit_id, property_id } = agreementRows[0];

        // --- Get landlord + their User ID ---
        const [landlordUserRows]: any = await connection.execute(
            `
        SELECT l.landlord_id, l.user_id AS landlord_user_id
        FROM Landlord l
        WHERE l.landlord_id = (
          SELECT landlord_id FROM Property WHERE property_id = ?
        )
      `,
            [property_id]
        );

        if (!landlordUserRows.length) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Landlord not found for property" },
                { status: 404 }
            );
        }

        const { landlord_id, landlord_user_id } = landlordUserRows[0];

        // --- Generate custom request_id + priority ---
        const request_id = generateMaintenanceId();
        const priority_level = is_emergency ? "HIGH" : "LOW";

        // --- Prevent duplicate request_id ---
        const [exists]: any = await connection.execute(
            `SELECT request_id FROM MaintenanceRequest WHERE request_id = ?`,
            [request_id]
        );
        if (exists.length > 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Duplicate request_id detected" },
                { status: 409 }
            );
        }

        // --- Insert Maintenance Request (subject = category) ---
        await connection.execute(
            `
        INSERT INTO MaintenanceRequest
          (request_id, tenant_id, unit_id, subject, description, category, status, priority_level)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
      `,
            [request_id, tenant_id, unit_id, category, description, category, priority_level]
        );

        // --- Upload Photos (if any) ---
        if (files.length > 0) {
            const uploads: any[] = [];
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const safeName = sanitizeFilename(file.name);
                const key = `maintenancePhoto/${Date.now()}_${safeName}`;
                const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
                const encryptedUrl = JSON.stringify(
                    encryptData(photoUrl, encryptionSecret)
                );

                await s3Client.send(
                    new PutObjectCommand({
                        Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                        Key: key,
                        Body: buffer,
                        ContentType: file.type,
                    })
                );

                uploads.push([request_id, encryptedUrl, new Date(), new Date()]);
            }

            await connection.query(
                `INSERT INTO MaintenancePhoto (request_id, photo_url, created_at, updated_at) VALUES ?`,
                [uploads]
            );
        }

        // --- Resolve tenant's real user_id for ActivityLog ---
        const [tenantUser]: any = await connection.execute(
            `SELECT user_id FROM Tenant WHERE tenant_id = ?`,
            [tenant_id]
        );
        const tenant_user_id = tenantUser?.[0]?.user_id || null;

        if (tenant_user_id) {
            await connection.execute(
                `INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())`,
                [tenant_user_id, `Created Maintenance Request: ${category} - ${description}`]
            );
        } else {
            console.warn("⚠️ Tenant user_id not found — skipping ActivityLog insert");
        }

        // --- Fetch property/unit for contextual notification ---
        const [propertyUnit]: any = await connection.execute(
            `
      SELECT 
        p.property_name, 
        u.unit_name
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      WHERE u.unit_id = ?
      `,
            [unit_id]
        );

        const property_name = propertyUnit?.[0]?.property_name || "Unknown Property";
        const unit_name = propertyUnit?.[0]?.unit_name || "Unknown Unit";

        // --- Contextual Notification ---
        let title: string;
        let body: string;

        if (is_emergency) {
            title = `🚨 Urgent Maintenance Request from ${property_name} - ${unit_name}`;
            body = `An urgent maintenance issue (${category}) was reported for ${unit_name} at ${property_name}. Please take immediate action.`;
        } else {
            title = `🧰 Maintenance Request from ${property_name} - ${unit_name}`;
            body = `A new maintenance request (${category}) has been created for ${unit_name} at ${property_name}.`;
        }

        const url = `/pages/landlord/maintenance-request?property=${encodeURIComponent(
            property_name
        )}&unit=${encodeURIComponent(unit_name)}&id=${request_id}`;

        await connection.execute(
            `
        INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, NOW())
      `,
            [landlord_user_id, title, body, url]
        );

        // --- Web Push (if landlord subscribed) ---
        const [subs]: any = await connection.execute(
            `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
            [landlord_user_id]
        );

        if (subs.length > 0) {
            const payload = JSON.stringify({
                title,
                body,
                icon: "/icons/maintenance.png",
                data: { url },
            });

            for (const sub of subs) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        },
                        payload
                    );
                } catch (err: any) {
                    console.warn("⚠️ Web push failed:", err.message);

                    // ✅ Automatically clean up invalid subscriptions
                    if (
                        err.statusCode === 404 || // "Not Found" – endpoint removed
                        err.statusCode === 410 || // "Gone" – subscription expired
                        err.message?.includes("no longer valid") // some browsers return this text
                    ) {
                        try {
                            await connection.execute(
                                `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                                [sub.endpoint]
                            );
                            console.log(`🧹 Removed invalid push subscription: ${sub.endpoint}`);
                        } catch (cleanupErr: any) {
                            console.error("❌ Failed to delete invalid subscription:", cleanupErr);
                        }
                    }
                }
            }
        }

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                message: "Maintenance request created successfully",
                request_id,
                priority_level,
            },
            { status: 201 }
        );
    } catch (err: any) {
        console.error("Maintenance creation error:", err);
        try {
            await db.query("ROLLBACK");
        } catch {}
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release?.();
    }
}
