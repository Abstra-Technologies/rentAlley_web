import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";

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

export async function POST(req: Request) {
  const formData = await req.formData();

  const property_id = formData.get("property_id") as string;
  const unitName = formData.get("unitName") as string;
  const unitSize = formData.get("unitSize") as string;
  const rentAmt = formData.get("rentAmt") as string;
  const furnish = formData.get("furnish") as string;
  const amenities = formData.get("amenities") as string;
  const status = formData.get("status") as string || "unoccupied";
  const unitType = formData.get("unitType") as string;

  if (!property_id || !unitName || !rentAmt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const files: File[] = [];
  for (const entry of formData.entries()) {
    if (entry[1] instanceof File) files.push(entry[1]);
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Step 1: Insert Unit
    const [unitResult]: any = await connection.execute(
        `INSERT INTO Unit
       (property_id, unit_name, unit_size, rent_amount, furnish, amenities, status, unit_style)
       VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
        [
          property_id,
          unitName,
          unitSize || null,
          rentAmt,
          furnish,
          amenities || "",
          status,
            unitType
        ]
    );

    const unitId = unitResult.insertId;

    // Step 2: Handle Photos (if any)
    if (files.length > 0) {
      const uploadedFilesData = await Promise.all(
          files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const sanitizedFilename = sanitizeFilename(file.name);
            const fileName = `unitPhoto/${Date.now()}_${sanitizedFilename}`;
            const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;

            const encryptedUrl = JSON.stringify(
                encryptData(photoUrl, encryptionSecret)
            );

            await s3Client.send(
                new PutObjectCommand({
                  Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                  Key: fileName,
                  Body: buffer,
                  ContentType: file.type,
                })
            );

            return [unitId, encryptedUrl, new Date(), new Date()];
          })
      );

      await connection.query(
          `INSERT INTO UnitPhoto (unit_id, photo_url, created_at, updated_at)
         VALUES ?`,
          [uploadedFilesData]
      );
    }

    await connection.commit();

    return NextResponse.json(
        {
          message: "Unit and photos uploaded successfully",
          unitId,
        },
        { status: 201 }
    );
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Error creating unit with photos:", error);
    return NextResponse.json(
        { error: "Failed to create unit: " + error.message },
        { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
