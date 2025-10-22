import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import { generatePropertyId } from "@/utils/id_generator";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

async function uploadToS3(file: any, folder: string) {
    if (!file || typeof file.arrayBuffer !== "function") {
        throw new Error("Invalid file object received in uploadToS3");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedFilename = sanitizeFilename(file.name ?? "upload");
    const fileName = `${folder}/${Date.now()}_${sanitizedFilename}`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: fileName,
            Body: buffer,
            ContentType: file.type ?? "application/octet-stream",
        })
    );

    const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
    return encryptData(s3Url, encryptionSecret);
}

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const landlord_id = formData.get("landlord_id")?.toString();
    const propertyRaw = formData.get("property")?.toString();

    if (!landlord_id || !propertyRaw) {
        return NextResponse.json({ error: "Missing landlord_id or property data" }, { status: 400 });
    }

    const property = JSON.parse(propertyRaw);

    const photos = formData.getAll("photos") as File[];
    const docType = formData.get("docType")?.toString();
    const submittedDoc = formData.get("submittedDoc") as File | null;
    const govID = formData.get("govID") as File | null;
    const indoor = formData.get("indoor") as File | null;
    const outdoor = formData.get("outdoor") as File | null;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // ✅ Generate a custom alphanumeric property_id
        const propertyId = generatePropertyId();

        // 1️⃣ Insert property with separated billing types + new fields
        await connection.execute(
            `INSERT INTO Property (
                property_id, landlord_id, property_name, property_type, amenities, street,
                brgy_district, city, zip_code, province,
                water_billing_type, electricity_billing_type,
                description, floor_area,
                min_stay, late_fee, assoc_dues,
                payment_frequency, flexipay_enabled, property_preferences,
                accepted_payment_methods, latitude, longitude,
                rent_increase_percent, security_deposit_months, advance_payment_months,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                propertyId, // ✅ use generated ID
                landlord_id,
                property.propertyName,
                property.propertyType,
                property.amenities?.join(",") || null,
                property.street || null,
                property.brgyDistrict || null,
                property.city || null,
                property.zipCode || null,
                property.province || null,
                property.waterBillingType || null,
                property.electricityBillingType || null,
                property.propDesc || null,
                property.floorArea,
                property.minStay || null,
                property.lateFee || 0.0,
                property.assocDues || 0.0,
                property.paymentFrequency || null,
                property.flexiPayEnabled || 0,
                JSON.stringify(property.propertyPreferences || []),
                JSON.stringify(property.paymentMethodsAccepted || []),
                property.lat || null,
                property.lng || null,
                property.rentIncreasePercent || 0.0,
                property.securityDepositMonths || 0,
                property.advancePaymentMonths || 0,
            ]
        );

        // 2️⃣ Upload property photos
        for (const file of photos) {
            const url = await uploadToS3(file, "property-photo");
            await connection.execute(
                `INSERT INTO PropertyPhoto (property_id, photo_url, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
                [propertyId, url]
            );
        }

        // 3️⃣ Upload verification docs
        if (!docType || !submittedDoc || !govID || !indoor || !outdoor) {
            throw new Error("Missing verification files");
        }

        const submittedDocUrl = await uploadToS3(submittedDoc, "property-doc");
        const govIdUrl = await uploadToS3(govID, "property-doc");
        const indoorUrl = await uploadToS3(indoor, "property-photo/indoor");
        const outdoorUrl = await uploadToS3(outdoor, "property-photo/outdoor");

        await connection.execute(
            `INSERT INTO PropertyVerification
             (property_id, doc_type, submitted_doc, gov_id, indoor_photo, outdoor_photo, status, created_at, updated_at, verified, attempts)
             VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW(), 0, 1)
             ON DUPLICATE KEY UPDATE
                                  doc_type = VALUES(doc_type),
                                  submitted_doc = VALUES(submitted_doc),
                                  gov_id = VALUES(gov_id),
                                  indoor_photo = VALUES(indoor_photo),
                                  outdoor_photo = VALUES(outdoor_photo),
                                  status = 'Pending',
                                  updated_at = NOW(),
                                  attempts = attempts + 1`,
            [propertyId, docType, submittedDocUrl, govIdUrl, indoorUrl, outdoorUrl]
        );

        // 4️⃣ Commit everything
        await connection.commit();

        return NextResponse.json({ message: "Property created successfully", propertyID: propertyId }, { status: 201 });
    } catch (err: any) {
        await connection.rollback();
        console.error("Transaction failed:", err);
        return NextResponse.json({ error: "Failed to create property listing", details: err.message }, { status: 500 });
    } finally {
        connection.release();
    }
}
