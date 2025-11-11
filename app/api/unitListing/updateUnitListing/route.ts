import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt"; // ✅ Import encryption
import fs from "fs/promises";
import path from "path";

/**
 * Utility to sanitize filenames
 */
function sanitizeFilename(filename: string): string {
    return filename
        .normalize("NFD") // remove diacritics
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
}

export async function PUT(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing unit ID" }, { status: 400 });
    }

    console.log('unit id:', id);

    const connection = await db.getConnection();
    const encryptionSecret = process.env.ENCRYPTION_SECRET;

    try {
        // Parse multipart data manually (no formidable)
        const formData = await req.formData();

        console.log('form data', formData);

        const unitName = formData.get("unitName")?.toString() ?? null;
        const unitSize = Number(formData.get("unitSize")) || null;
        const rentAmt = Number(formData.get("rentAmt")) || null;
        const furnish = formData.get("furnish")?.toString() ?? null;
        const unitType = formData.get("unitType")?.toString() ?? null;
        const amenities = formData.get("amenities")?.toString() ?? "";

        const uploadedFiles = formData.getAll("files") as File[];

        // Validate
        if (!unitName || !unitSize || !rentAmt) {
            return NextResponse.json(
                { error: "Required fields missing" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        const [existingRows]: any = await connection.execute(
            `SELECT unit_id FROM Unit WHERE unit_id = ?`,
            [id]
        );

        if (existingRows.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        // ✅ Step 2: Update unit details
        await connection.execute(
            `UPDATE Unit 
         SET unit_name = ?, 
             unit_size = ?, 
             rent_amount = ?, 
             furnish = ?, 
             unit_style = ?, 
             amenities = ?, 
             updated_at = CURRENT_TIMESTAMP 
       WHERE unit_id = ?`,
            [unitName, unitSize, rentAmt, furnish, unitType, amenities, id]
        );

        // ✅ Step 3: Upload and encrypt photo URLs
        if (uploadedFiles && uploadedFiles.length > 0) {
            const photoRecords: any[] = [];

            for (const file of uploadedFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const sanitized = sanitizeFilename(file.name || "unit-photo.jpg");

                // Upload to S3
                const s3Url = await uploadToS3(
                    buffer,
                    sanitized,
                    file.type || "image/jpeg",
                    "unitPhotos"
                );

                // ✅ Encrypt the S3 URL before storing
                const encryptedUrl = JSON.stringify(encryptData(s3Url, encryptionSecret));

                photoRecords.push([id, encryptedUrl, new Date(), new Date()]);
            }

            if (photoRecords.length > 0) {
                await connection.query(
                    `INSERT INTO UnitPhoto (unit_id, photo_url, created_at, updated_at)
           VALUES ?`,
                    [photoRecords]
                );
            }
        }

        await connection.commit();

        return NextResponse.json(
            {
                message: "✅ Unit updated successfully with encrypted photo URLs",
                unit_id: id,
                uploadedPhotos: uploadedFiles.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Error updating unit:", error);
        await connection.rollback();

        return NextResponse.json(
            { error: "Failed to update unit listing", details: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
