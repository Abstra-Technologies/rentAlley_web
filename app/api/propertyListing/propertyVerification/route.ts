
//  upload property verificsation fovcumernt rtoute.ts TO BE DELETE
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import { db } from "@/lib/db";

const s3 = new S3Client({
  region: process.env.NEXT_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

const encryptDataString = (data: string) => {
  return encryptData(data, process.env.ENCRYPTION_SECRET!);
};

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

async function uploadToS3(file: File, folder: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitizedFilename = sanitizeFilename(file.name);
  const fileName = `${folder}/${Date.now()}_${sanitizedFilename}`;

  const params = {
    Bucket: process.env.NEXT_S3_BUCKET_NAME!,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  };

  await s3.send(new PutObjectCommand(params));

  const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
  return encryptDataString(s3Url);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const property_id = formData.get("property_id")?.toString();
  const docType = formData.get("docType")?.toString(); // business_permit | occupancy_permit | property_title
  const submittedDoc = formData.get("submittedDoc") as File | null;
  const indoorFile = formData.get("indoor") as File | null;
  const outdoorFile = formData.get("outdoor") as File | null;
  const govIdFile = formData.get("govID") as File | null;

  if (!property_id || !docType || !submittedDoc || !govIdFile || !indoorFile || !outdoorFile) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
        "SELECT property_id FROM Property WHERE property_id = ?",
        [Number(property_id)]
    );
    // @ts-ignore
    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid property_id: No matching property found" }, { status: 400 });
    }

    await connection.beginTransaction();

    // Upload files
    const submittedDocUrl = await uploadToS3(submittedDoc, "property-doc");
    const govID = await uploadToS3(govIdFile, "property-photo/govId");
    const indoorPhoto = await uploadToS3(indoorFile, "property-photo/indoor");
    const outdoorPhoto = await uploadToS3(outdoorFile, "property-photo/outdoor");

    const query = `
      INSERT INTO PropertyVerification 
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
        attempts = attempts + 1
    `;

    await connection.execute(query, [
      Number(property_id),
      docType,
      submittedDocUrl,
      govID,
      indoorPhoto,
      outdoorPhoto,
    ]);

    await connection.commit();

    return NextResponse.json({ message: "Files uploaded and stored successfully" }, { status: 201 });
  } catch (err) {
    await connection.rollback();
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    connection.release();
  }
}
