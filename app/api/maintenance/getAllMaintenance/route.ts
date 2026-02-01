import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { decryptData } from "@/crypto/encrypt";

//  used in work order page.

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Landlord ID is required" },
            { status: 400 }
        );
    }

    /* --------------------------------------------------
       REDIS CACHE KEY
    -------------------------------------------------- */
    const cacheKey = `maintenance:requests:${landlord_id}`;

    try {
        /* --------------------------------------------------
           CACHE HIT
        -------------------------------------------------- */
        const cached = await redis.get(cacheKey);
        if (cached) {
            let parsed;
            try {
                parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
            } catch {
                parsed = cached;
            }

            return NextResponse.json({ success: true, data: parsed });
        }

        /* --------------------------------------------------
           DATABASE QUERY
        -------------------------------------------------- */
        const query = `
            SELECT 
                mr.request_id,
                mr.subject,
                mr.description,
                mr.category,
                mr.priority_level,
                mr.status,
                mr.schedule_date,
                mr.completion_date,
                mr.created_at,

                p.property_id,
                p.property_name,

                un.unit_id,
                un.unit_name,

                u.firstName AS tenant_first_name,
                u.lastName AS tenant_last_name,
                u.email AS tenant_email,
                u.phoneNumber AS tenant_phone,

                a.asset_id,
                a.asset_name,
                a.category AS asset_category,
                a.model AS asset_model,
                a.manufacturer AS asset_manufacturer,
                a.serial_number AS asset_serial_number,
                a.condition AS asset_condition,
                a.status AS asset_status,
                a.image_urls AS asset_image_urls,

                COALESCE(GROUP_CONCAT(mp.photo_url SEPARATOR '||'), '') AS photo_urls

            FROM MaintenanceRequest mr
            JOIN Property p ON mr.property_id = p.property_id
            LEFT JOIN Unit un ON mr.unit_id = un.unit_id
            LEFT JOIN Tenant t ON mr.tenant_id = t.tenant_id
            LEFT JOIN User u ON t.user_id = u.user_id
            LEFT JOIN Asset a ON mr.asset_id = a.asset_id
            LEFT JOIN MaintenancePhoto mp ON mr.request_id = mp.request_id

            WHERE p.landlord_id = ?
            GROUP BY mr.request_id
            ORDER BY mr.created_at DESC
        `;

        const [rows]: any = await db.query(query, [landlord_id]);

        /* --------------------------------------------------
           FORMAT + DECRYPT (ONCE)
        -------------------------------------------------- */
        const formatted = rows.map((req: any) => {
            // 🔐 decrypt maintenance photos
            let decryptedPhotos: string[] = [];
            if (req.photo_urls) {
                decryptedPhotos = req.photo_urls
                    .split("||")
                    .filter(Boolean)
                    .map((enc: string) => {
                        try {
                            return decryptData(JSON.parse(enc), SECRET_KEY);
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean);
            }

            // 🔐 decrypt tenant info
            let first, last, email;
            if (req.tenant_first_name) {
                try {
                    first = decryptData(JSON.parse(req.tenant_first_name), SECRET_KEY);
                    last = decryptData(JSON.parse(req.tenant_last_name), SECRET_KEY);
                    email = decryptData(JSON.parse(req.tenant_email), SECRET_KEY);
                } catch {}
            }

            // 📦 asset images
            let assetImages: string[] = [];
            try {
                if (req.asset_image_urls) {
                    assetImages = JSON.parse(req.asset_image_urls);
                }
            } catch {}

            return {
                request_id: req.request_id,
                subject: req.subject,
                description: req.description,
                category: req.category,
                priority_level: req.priority_level,
                status: req.status,
                schedule_date: req.schedule_date,
                completion_date: req.completion_date,
                created_at: req.created_at,

                property: {
                    property_id: req.property_id,
                    property_name: req.property_name,
                },

                unit: req.unit_id
                    ? {
                        unit_id: req.unit_id,
                        unit_name: req.unit_name,
                    }
                    : null,

                tenant: req.tenant_first_name
                    ? {
                        first_name: first,
                        last_name: last,
                        email,
                        phone: req.tenant_phone,
                    }
                    : null,

                asset: req.asset_id
                    ? {
                        asset_id: req.asset_id,
                        asset_name: req.asset_name,
                        category: req.asset_category,
                        model: req.asset_model,
                        manufacturer: req.asset_manufacturer,
                        serial_number: req.asset_serial_number,
                        condition: req.asset_condition,
                        status: req.asset_status,
                        image_urls: assetImages,
                    }
                    : null,

                photo_urls: decryptedPhotos,
            };
        });

        /* --------------------------------------------------
           CACHE RESULT
        -------------------------------------------------- */
        await redis.set(
            cacheKey,
            JSON.stringify(formatted),
            { ex: 60 } // ⏱ 1 minute (status can change)
        );

        return NextResponse.json({ success: true, data: formatted });
    } catch (error) {
        console.error("[MAINTENANCE_REQUESTS_ERROR]", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
