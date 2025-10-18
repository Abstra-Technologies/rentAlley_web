import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import webpush from "web-push";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

// 🔑 Web Push keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
webpush.setVapidDetails("mailto:support@upkyp.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

function detectDevice(ua: string) {
    const agent = ua.toLowerCase();
    if (agent.includes("mobile")) return "mobile";
    if (agent.includes("tablet") || agent.includes("ipad")) return "tablet";
    return "web";
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const deviceType = detectDevice(userAgent);
    const endpoint = req.url;
    const httpMethod = req.method;
    const statusCode = 201;

    try {
        const formData = await req.formData();
        const property_ids = formData.getAll("property_ids[]").map(Number);
        const subject = formData.get("subject") as string;
        const description = formData.get("description") as string;
        const landlord_id = Number(formData.get("landlord_id"));

        if (!property_ids || property_ids.length === 0 || !subject || !description || !landlord_id) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }

        // Collect uploaded files
        const files: File[] = [];
        for (const [, value] of formData.entries()) {
            if (value instanceof File) {
                files.push(value);
            }
        }

        // Fetch landlord → user_id
        const [landlordRows] = await db.execute(
            `SELECT user_id FROM Landlord WHERE landlord_id = ?`,
            [landlord_id]
        );
        const landlord = (landlordRows as any[])[0];
        if (!landlord) {
            return NextResponse.json({ message: "Landlord not found" }, { status: 404 });
        }
        const user_id = landlord.user_id;

        // Prepare queries
        const insertAnnouncementQuery = `
        INSERT INTO Announcement (property_id, landlord_id, subject, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW());
    `;
        const insertPhotoQuery = `
        INSERT INTO AnnouncementPhoto (announcement_id, photo_url, created_at)
        VALUES (?, ?, NOW());
    `;
        const tenantQuery = `
        SELECT DISTINCT t.user_id
        FROM LeaseAgreement la
                 JOIN Tenant t ON la.tenant_id = t.tenant_id
                 JOIN Unit u ON la.unit_id = u.unit_id
        WHERE u.property_id = ? AND la.status = 'active'
    `;
        const notificationQuery = `
        INSERT INTO Notification (user_id, title, body, is_read, created_at)
        VALUES (?, ?, ?, 0, NOW())
    `;

        const maxBodyLength = 300;
        const truncatedDescription =
            description.length > maxBodyLength
                ? description.slice(0, maxBodyLength) + "..."
                : description;

        const createdAnnouncements: any[] = [];

        for (const property_id of property_ids) {
            const [result]: any = await db.execute(insertAnnouncementQuery, [
                property_id,
                landlord_id,
                subject,
                description,
            ]);
            const announcement_id = result.insertId;

            const photoRecords: string[] = [];

            // Upload and save photos
            if (files.length > 0) {
                for (const file of files) {
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const sanitizedFilename = sanitizeFilename(file.name);
                    const fileName = `announcementPhoto/${Date.now()}_${sanitizedFilename}`;
                    const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
                    const encryptedUrl = JSON.stringify(encryptData(photoUrl, encryptionSecret));

                    await s3Client.send(
                        new PutObjectCommand({
                            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                            Key: fileName,
                            Body: buffer,
                            ContentType: file.type,
                        })
                    );

                    await db.execute(insertPhotoQuery, [announcement_id, encryptedUrl]);
                    photoRecords.push(photoUrl);
                }
            }

            // Find active tenants
            const [tenants] = await db.execute(tenantQuery, [property_id]);

            for (const tenant of tenants as any[]) {
                // Save Notification
                await db.execute(notificationQuery, [tenant.user_id, subject, truncatedDescription]);

                // Fetch WebPush subs
                const [subs]: any = await db.execute(
                    `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
                    [tenant.user_id]
                );

                if (subs.length > 0) {
                    const payload = JSON.stringify({
                        title: subject,
                        body: truncatedDescription,
                        url: "/pages/tenant/feeds",
                    });

                    for (const sub of subs) {
                        const subscription = {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        };

                        try {
                            await webpush.sendNotification(subscription, payload);
                            console.log("✅ Push sent to tenant:", sub.endpoint);
                        } catch (err: any) {
                            console.error("❌ Push failed:", err.message);
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                await db.execute(
                                    `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                                    [sub.endpoint]
                                );
                                console.log("🗑️ Removed invalid subscription:", sub.endpoint);
                            }
                        }
                    }
                }
            }

            // Save for Activity Log summary
            createdAnnouncements.push({
                announcement_id,
                property_id,
                subject,
                files: photoRecords,
            });
        }

        // 🧾 Insert detailed Activity Log
        await db.execute(
            `INSERT INTO ActivityLog (
         user_id, action, description, target_table, target_id, old_value, new_value,
         endpoint, http_method, status_code, ip_address, user_agent, device_type, is_suspicious, timestamp
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
            [
                user_id,
                "Created Announcement",
                `Created announcement "${subject}" for ${property_ids.length} property(ies).`,
                "Announcement",
                String(createdAnnouncements.map(a => a.announcement_id).join(",")),
                null,
                JSON.stringify(createdAnnouncements),
                endpoint,
                httpMethod,
                statusCode,
                ip,
                userAgent,
                deviceType,
            ]
        );

        return NextResponse.json(
            { message: "Announcements created and notifications sent." },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating announcement:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

