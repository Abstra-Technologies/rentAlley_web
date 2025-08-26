import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
    const formData = await req.formData();

    const agreementId = formData.get("agreement_id")?.toString();
    if (!agreementId) {
        return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });
    }

    const itemsData = formData.get("items")?.toString();
    if (!itemsData) {
        return NextResponse.json({ error: "Missing checklist items" }, { status: 400 });
    }

    let items: any[];
    try {
        items = JSON.parse(itemsData);
    } catch {
        return NextResponse.json({ error: "Invalid items JSON" }, { status: 400 });
    }

    // Map files by field name
    const filesMap: Record<string, File[]> = {};
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            if (!filesMap[key]) filesMap[key] = [];
            filesMap[key].push(value);
        }
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create MoveInChecklist
        const [checklistResult] = await connection.query(
            `INSERT INTO MoveInChecklist (agreement_id, status, created_at, updated_at) VALUES (?, 'completed', NOW(), NOW())`,
            [agreementId]
        );
        // @ts-ignore
        const checklistId = checklistResult.insertId;

        const savedItems: any[] = [];

        // 2. Save each item
        for (const item of items) {

            const [itemResult] = await connection.query(
                `INSERT INTO MoveInItems (checklist_id, item_name, \`condition\`, notes, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [checklistId, item.item_name, item.condition, item.notes]
            );

            // @ts-ignore
            const itemId = itemResult.insertId;
            savedItems.push({ ...item, item_id: itemId });

            // 3. Upload photos if any
            if (item.photos?.length) {
                const uploadResults = await Promise.all(
                    item.photos.map(async (fileIndex: string) => {
                        const file = filesMap[fileIndex]?.[0];
                        if (!file) return null;

                        const arrayBuffer = await file.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const sanitizedFilename = sanitizeFilename(file.name);
                        const fileName = `moveInPhotos/${Date.now()}_${sanitizedFilename}`;
                        const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
                        const encryptedUrl = JSON.stringify(encryptData(photoUrl, encryptionSecret));

                        const uploadParams = {
                            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                            Key: fileName,
                            Body: buffer,
                            ContentType: file.type,
                        };
                        await s3Client.send(new PutObjectCommand(uploadParams));

                        await connection.query(
                            `INSERT INTO MoveInPhotos (item_id, photo_url, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
                            [itemId, encryptedUrl]
                        );

                        return photoUrl;
                    })
                );

                item.uploadedPhotos = uploadResults.filter(Boolean);
            }
        }

        await connection.commit();

        return NextResponse.json({
            message: "Move-In checklist saved successfully",
            checklist_id: checklistId,
            items: savedItems,
        }, { status: 201 });

    } catch (error: any) {
        await connection.rollback();
        console.error("Move-In save error:", error);
        return NextResponse.json({ error: error.message || "Save failed" }, { status: 500 });
    } finally {
        connection.release?.();
    }
}
