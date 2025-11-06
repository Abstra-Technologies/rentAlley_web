import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData, decryptData } from "@/crypto/encrypt";
import { jwtVerify } from "jose";
import { cookies as getCookies } from "next/headers";

// Initialize AWS S3 Client
const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

// Utility — sanitize filenames
function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

// ===========================
// ✅ PUT — Update Property + Photos
// ===========================
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

        // ========================
        // 1️⃣ Extract property data
        // ========================
        const bodyRaw = formData.get("data")?.toString() || "{}";
        const body = JSON.parse(bodyRaw);

        // Normalize fields
        const propertyName = body.propertyName ?? body.property_name ?? null;
        const propertyType = body.propertyType ?? body.property_type ?? null;
        const street = body.street ?? null;
        const brgyDistrict = body.brgyDistrict ?? body.brgy_district ?? null;
        const city = body.city ?? null;
        const zipCode = body.zipCode ?? body.zip_code ?? null;
        const province = body.province ?? null;

        const waterBillingType = body.waterBillingType ?? body.water_billing_type ?? null;
        const electricityBillingType = body.electricityBillingType ?? body.electricity_billing_type ?? null;

        const propDesc = body.propDesc ?? body.description ?? null;
        const floorArea = body.floorArea ?? body.floor_area ?? null;
        const minStay = body.minStay ?? body.min_stay ?? null;
        const flexiPayEnabled = body.flexiPayEnabled ?? body.flexipay_enabled ?? false;
        const amenities = body.amenities ?? null;
        const paymentMethodsAccepted = body.paymentMethodsAccepted ?? body.accepted_payment_methods ?? null;
        const propertyPreferences = body.propertyPreferences ?? body.property_preferences ?? null;
        const latitude = body.lat ?? body.latitude ?? null;
        const longitude = body.lng ?? body.longitude ?? null;

        // Normalize arrays / JSON
        const amenitiesString = Array.isArray(amenities)
            ? amenities.join(",")
            : typeof amenities === "string"
                ? amenities
                : null;

        const propertyPreferencesJson = propertyPreferences
            ? Array.isArray(propertyPreferences)
                ? JSON.stringify(propertyPreferences)
                : typeof propertyPreferences === "string"
                    ? propertyPreferences
                    : JSON.stringify([propertyPreferences])
            : null;

        const paymentMethodsJson = paymentMethodsAccepted
            ? Array.isArray(paymentMethodsAccepted)
                ? JSON.stringify(paymentMethodsAccepted)
                : typeof paymentMethodsAccepted === "string"
                    ? paymentMethodsAccepted
                    : JSON.stringify([paymentMethodsAccepted])
            : null;

        // ========================
        // 2️⃣ Update property
        // ========================
        const [existingRows] = await connection.execute(
            `SELECT property_id FROM Property WHERE property_id = ? LIMIT 1`,
            [property_id]
        );

        // @ts-ignore
        if (!existingRows.length) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        await connection.execute(
            `UPDATE Property SET
        property_name = ?, property_type = ?, amenities = ?, street = ?, brgy_district = ?, city = ?, zip_code = ?, province = ?,
        water_billing_type = ?, electricity_billing_type = ?, description = ?, floor_area = ?, min_stay = ?,
        flexipay_enabled = ?, property_preferences = ?, accepted_payment_methods = ?, latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP
      WHERE property_id = ?`,
            [
                propertyName,
                propertyType,
                amenitiesString,
                street,
                brgyDistrict,
                city,
                zipCode,
                province,
                waterBillingType,
                electricityBillingType,
                propDesc,
                floorArea,
                minStay,
                flexiPayEnabled,
                propertyPreferencesJson,
                paymentMethodsJson,
                latitude,
                longitude,
                property_id,
            ]
        );

        // ========================
        // 3️⃣ Handle photo uploads
        // ========================
        const files = formData.getAll("files");
        if (files.length > 0) {
            const uploadedFilesData = await Promise.all(
                files.map(async (file: any) => {
                    if (typeof file === "string") return null;
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const sanitizedFilename = sanitizeFilename(file.name);
                    const fileName = `propertyPhoto/${Date.now()}_${sanitizedFilename}`;
                    const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
                    const encryptedUrl = JSON.stringify(encryptData(photoUrl, encryptionSecret));

                    const uploadParams = {
                        Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                        Key: fileName,
                        Body: buffer,
                        ContentType: file.type,
                    };

                    await s3Client.send(new PutObjectCommand(uploadParams));

                    return [property_id, encryptedUrl, new Date(), new Date()];
                })
            );

            const values = uploadedFilesData.filter(Boolean);
            if (values.length > 0) {
                await connection.query(
                    `INSERT INTO PropertyPhoto (property_id, photo_url, created_at, updated_at) VALUES ?`,
                    [values]
                );
            }
        }

        // ========================
        // 4️⃣ Log activity
        // ========================
        const token = cookies.get("token")?.value;
        if (token) {
            const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secretKey);
            const loggedUser = payload.user_id;

            await connection.query(
                "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
                [loggedUser, `Updated Property ${propertyName}`]
            );
        }

        await connection.commit();
        return NextResponse.json({ success: true, message: "Property updated successfully." });
    } catch (err: any) {
        await connection.rollback();
        console.error("❌ Property Update Error:", err);
        return NextResponse.json({ error: err.message || "Failed to update property" }, { status: 500 });
    } finally {
        connection.release();
    }
}
