import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { jwtVerify } from "jose";
import { cookies as getCookies } from "next/headers";

// AWS S3 Client
const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

// Sanitize filenames
function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

// =====================================
//  PUT — Update Property + Upload Photos
// =====================================
export async function PUT(req: NextRequest) {
    const cookies = getCookies();
    const property_id = req.nextUrl.searchParams.get("property_id");
    const formData = await req.formData();

    if (!property_id) {
        return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // ========================================================
        // 1️⃣ Parse Property Data
        // ========================================================
        const raw = formData.get("data")?.toString() || "{}";
        const body = JSON.parse(raw);

        const fields = {
            property_name: body.propertyName,
            property_type: body.propertyType,
            amenities: Array.isArray(body.amenities)
                ? body.amenities.join(",")
                : body.amenities || null,
            street: body.street ?? null,
            brgy_district: body.brgyDistrict ?? null,
            city: body.city ?? null,
            zip_code: body.zipCode ?? null,
            province: body.province ?? null,
            water_billing_type: body.water_billing_type ?? body.waterBillingType ?? null,
            electricity_billing_type:
                body.electricity_billing_type ?? body.electricityBillingType ?? null,
            description: body.description ?? null,
            floor_area: body.floorArea ?? null,
            late_fee: body.late_fee ?? null,
            assoc_dues: body.assoc_dues ?? null,
            flexipay_enabled: body.flexipay_enabled ?? body.flexiPayEnabled ?? 0,
            property_preferences: body.propertyPreferences
                ? JSON.stringify(body.propertyPreferences)
                : null,
            accepted_payment_methods: body.paymentMethodsAccepted
                ? JSON.stringify(body.paymentMethodsAccepted)
                : null,
            latitude: body.lat ?? body.latitude ?? null,
            longitude: body.lng ?? body.longitude ?? null,
            rent_increase_percent: body.rent_increase_percent ?? 0,
        };

        // ========================================================
        // 2️⃣ Ensure property exists
        // ========================================================
        const [rows] = await connection.query(
            "SELECT property_id FROM Property WHERE property_id = ? LIMIT 1",
            [property_id]
        );

        // @ts-ignore
        if (rows.length === 0) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        // ========================================================
        // 3️⃣ Update Property
        // ========================================================
        await connection.query(
            `
      UPDATE Property SET
        property_name=?, property_type=?, amenities=?, street=?, brgy_district=?, city=?, zip_code=?, province=?,
        water_billing_type=?, electricity_billing_type=?, description=?, floor_area=?, late_fee=?, assoc_dues=?,
        flexipay_enabled=?, property_preferences=?, accepted_payment_methods=?, latitude=?, longitude=?,
        rent_increase_percent=?, updated_at=CURRENT_TIMESTAMP
      WHERE property_id=?
      `,
            [
                fields.property_name,
                fields.property_type,
                fields.amenities,
                fields.street,
                fields.brgy_district,
                fields.city,
                fields.zip_code,
                fields.province,
                fields.water_billing_type,
                fields.electricity_billing_type,
                fields.description,
                fields.floor_area,
                fields.late_fee,
                fields.assoc_dues,
                fields.flexipay_enabled,
                fields.property_preferences,
                fields.accepted_payment_methods,
                fields.latitude,
                fields.longitude,
                fields.rent_increase_percent,
                property_id,
            ]
        );

        // ========================================================
        // 4️⃣ Save New Photos to S3
        // ========================================================
        const files = formData.getAll("files");

        if (files.length > 0) {
            const uploaded = await Promise.all(
                files.map(async (file: any) => {
                    if (typeof file === "string") return null;

                    const buffer = Buffer.from(await file.arrayBuffer());
                    const cleanName = sanitizeFilename(file.name);
                    const fileName = `propertyPhoto/${Date.now()}_${cleanName}`;

                    const uploadedUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${
                        process.env.NEXT_AWS_REGION
                    }.amazonaws.com/${fileName}`;

                    const encryptedUrl = JSON.stringify(
                        encryptData(uploadedUrl, encryptionSecret)
                    );

                    await s3Client.send(
                        new PutObjectCommand({
                            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                            Key: fileName,
                            Body: buffer,
                            ContentType: file.type,
                        })
                    );

                    return [property_id, encryptedUrl, new Date(), new Date()];
                })
            );

            const values = uploaded.filter(Boolean);

            if (values.length > 0) {
                await connection.query(
                    `INSERT INTO PropertyPhoto (property_id, photo_url, created_at, updated_at) VALUES ?`,
                    [values]
                );
            }
        }

        // ========================================================
        // 5️⃣ Log Activity
        // ========================================================
        const token = cookies.get("token")?.value;

        if (token) {
            const decoded = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );

            const userId = decoded.payload.user_id;

            await connection.query(
                "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
                [userId, `Edited Property: ${fields.property_name}`]
            );
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Property updated successfully.",
        });
    } catch (err: any) {
        await connection.rollback();
        console.error("❌ UPDATE PROPERTY ERROR:", err);
        return NextResponse.json(
            { error: err.message || "Failed to update property." },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
