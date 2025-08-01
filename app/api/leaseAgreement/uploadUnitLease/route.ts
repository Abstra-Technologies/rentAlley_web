import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import { randomUUID } from "crypto";

const encryptionSecret = process.env.ENCRYPTION_SECRET;

const s3 = new S3Client({
  region: process.env.NEXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

async function bufferFile(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const unit_id = formData.get("unit_id")?.toString();
console.log('unit id', unit_id);
    if (!unit_id) {
      return NextResponse.json(
        { error: "unit_id is required" },
        { status: 400 }
      );
    }

    const file = formData.get("leaseFile") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No lease file uploaded" },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    const [tenantRows] = await connection.execute(
      `SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ? AND status = 'approved' LIMIT 1`,
      [unit_id]
    );

    // @ts-ignore
    if (!tenantRows || tenantRows.length === 0) {
      return NextResponse.json(
        { error: "No approved tenant found for this unit" },
        { status: 404 }
      );
    }

    // @ts-ignore
    const tenant_id = tenantRows[0].tenant_id;

    const [existingLease] = await connection.execute(
      `SELECT agreement_id FROM LeaseAgreement WHERE tenant_id = ? AND unit_id = ?`,
      [tenant_id, unit_id]
    );

    // @ts-ignore
    if (existingLease.length > 0) {
      return NextResponse.json(
        { error: "Lease agreement already exists for this tenant and unit." },
        { status: 409 }
      );
    }

    const fileBuffer = await bufferFile(file);
    const sanitizedFilename = sanitizeFilename(file.name);
    const s3Key = `leaseAgreement/${Date.now()}_${randomUUID()}_${sanitizedFilename}`;

    const uploadParams = {
      Bucket: process.env.NEXT_S3_BUCKET_NAME!,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.type,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${s3Key}`;
    const encryptedUrl = JSON.stringify(encryptData(s3Url, encryptionSecret!));

    const [insertResult] = await connection.execute(
      `INSERT INTO LeaseAgreement (tenant_id, unit_id, agreement_url, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [tenant_id, unit_id, encryptedUrl]
    );

    // @ts-ignore
    if (insertResult.affectedRows !== 1) {
      throw new Error("Failed to insert lease agreement into database.");
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({
      message: "Lease agreement uploaded successfully.",
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
