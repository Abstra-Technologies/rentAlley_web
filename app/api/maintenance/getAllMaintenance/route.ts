import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Landlord ID is required" },
            { status: 400 }
        );
    }

    try {
        const query = `
      SELECT 
        mr.request_id,
        u.firstName AS tenant_first_name,
        u.lastName AS tenant_last_name,
        u.email AS tenant_email,
        u.phoneNumber AS tenant_phone,
        p.property_name,
        un.unit_name,
        mr.subject,
        mr.description,
        mr.category,
        mr.priority_level,
        mr.status,
        mr.schedule_date,
        mr.completion_date,
        mr.created_at,

        -- 🧩 Asset details
        a.asset_id,
        a.asset_name,
        a.category AS asset_category,
        a.model AS asset_model,
        a.manufacturer AS asset_manufacturer,
        a.serial_number AS asset_serial_number,
        a.condition AS asset_condition,
        a.status AS asset_status,
        a.image_urls AS asset_image_urls,

        COALESCE(GROUP_CONCAT(mp.photo_url SEPARATOR '||'), '[]') AS photo_urls
      FROM MaintenanceRequest mr
      JOIN Tenant t ON mr.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      JOIN Unit un ON mr.unit_id = un.unit_id
      JOIN Property p ON un.property_id = p.property_id
      LEFT JOIN Asset a ON mr.asset_id = a.asset_id
      LEFT JOIN MaintenancePhoto mp ON mr.request_id = mp.request_id
      WHERE p.landlord_id = ?
      GROUP BY 
        mr.request_id,
        tenant_first_name,
        tenant_last_name,
        tenant_email,
        tenant_phone,
        property_name,
        unit_name,
        subject,
        description,
        category,
        priority_level,
        status,
        schedule_date,
        completion_date,
        created_at,
        a.asset_id
    `;

        const [requests] = await db.query(query, [landlord_id]);

        const decryptedRequests = (requests as any[]).map((req) => {
            let decryptedPhotos: string[] = [];
            let decryptedFirstName = req.tenant_first_name;
            let decryptedLastName = req.tenant_last_name;
            let decyptedEmail = req.tenant_email;

            // Decrypt photo URLs
            if (req.photo_urls && req.photo_urls !== "[]") {
                try {
                    const parsedPhotos = req.photo_urls.split("||");
                    decryptedPhotos = parsedPhotos.map((photo) =>
                        decryptData(JSON.parse(photo), SECRET_KEY)
                    );
                } catch (error) {
                    console.error("Error decrypting photos:", error);
                }
            }

            // Decrypt tenant names
            try {
                decryptedFirstName = decryptData(
                    JSON.parse(req.tenant_first_name),
                    SECRET_KEY
                );
                decryptedLastName = decryptData(
                    JSON.parse(req.tenant_last_name),
                    SECRET_KEY
                );
                decyptedEmail = decryptData(
                    JSON.parse(req.tenant_email),
                    SECRET_KEY
                );
            } catch (error) {
                console.error("Error decrypting tenant details:", error);
            }

            // Parse asset image URLs
            let assetImages: string[] = [];
            try {
                if (req.asset_image_urls) {
                    assetImages = JSON.parse(req.asset_image_urls);
                }
            } catch (e) {
                console.error("Error parsing asset image URLs:", e);
            }

            // Format asset object if present
            const asset =
                req.asset_id != null
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
                    : null;

            return {
                ...req,
                tenant_first_name: decryptedFirstName,
                tenant_last_name: decryptedLastName,
                tenant_email: decyptedEmail,
                photo_urls: decryptedPhotos,
                priority_level: req.priority_level || "Medium",
                asset, // 🧩 embedded linked asset object
            };
        });

        return NextResponse.json({ success: true, data: decryptedRequests });
    } catch (error) {
        console.error("Error fetching maintenance requests:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
