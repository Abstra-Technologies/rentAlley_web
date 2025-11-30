import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMaintenanceId } from "@/utils/id_generator";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            subject,
            category,
            priority_level,
            description,
            landlord_id,
            property_id,
            unit_id,
            tenant_id,
            asset_id,        // ⭐ NEW: include asset ID
            user_id,
            photo_urls,
        } = body;

        if (!subject || !landlord_id || !property_id) {
            return NextResponse.json(
                { success: false, message: "Missing required fields." },
                { status: 400 }
            );
        }

        // Generate custom ID
        const request_id = generateMaintenanceId();

        // ⭐ INSERT WORK ORDER (with asset_id)
        await db.query(
            `
            INSERT INTO MaintenanceRequest (
                request_id,
                tenant_id,
                unit_id,
                asset_id,
                subject,
                description,
                status,
                category,
                priority_level,
                property_id,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, NOW())
            `,
            [
                request_id,
                tenant_id || null,
                unit_id || null,
                asset_id || null,     // ⭐ INSERT asset_id
                subject,
                description,
                category,
                priority_level,
                property_id
            ]
        );

        // ⭐ Handle photo uploads (unchanged)
        if (Array.isArray(photo_urls) && photo_urls.length > 0) {
            for (const base64 of photo_urls) {
                if (!base64) continue;

                const matches = base64.match(/^data:(.+);base64,(.+)$/);
                if (!matches) continue;

                const mimeType = matches[1];
                const buffer = Buffer.from(matches[2], "base64");

                const extension = mimeType.split("/")[1] || "jpg";
                const fileName = `${request_id}.${Date.now()}.${extension}`;

                const s3Url = await uploadToS3(
                    buffer,
                    fileName,
                    mimeType,
                    `maintenancePhoto/${request_id}`
                );

                await db.query(
                    `
                    INSERT INTO MaintenancePhoto (
                        request_id,
                        photo_url,
                        created_at
                    )
                    VALUES (?, ?, NOW())
                `,
                    [request_id, s3Url]
                );
            }
        }

        // Activity log
        await db.query(
            `
            INSERT INTO ActivityLog (user_id, action, timestamp)
            VALUES (?, ?, NOW())
            `,
            [user_id, `Created new work order ${request_id}`]
        );

        return NextResponse.json({
            success: true,
            message: "Work order created successfully.",
            data: {
                request_id,
                subject,
                category,
                priority_level,
                description,
                landlord_id,
                property_id,
                unit_id,
                tenant_id,
                asset_id,
                status: "pending",
                photo_count: photo_urls?.length ?? 0,
            },
        });
    } catch (error) {
        console.error("Error creating work order:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: error.message ?? error,
            },
            { status: 500 }
        );
    }
}
