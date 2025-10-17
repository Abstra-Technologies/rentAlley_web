import { NextRequest, NextResponse } from "next/server";
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

// ✅ Sanitize file names to avoid special characters
function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

async function uploadToS3(file: File, folder: string) {
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
    const encryptedUrl = encryptData(s3Url, encryptionSecret); // optional

    return { s3Url, encryptedUrl };
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const folder = "pdc_checks";

        const { s3Url } = await uploadToS3(file, folder);

        return NextResponse.json({ url: s3Url, message: "File uploaded successfully" }, { status: 201 });
    } catch (err: any) {
        console.error("S3 Upload Error:", err);
        return NextResponse.json(
            { error: "Failed to upload file to S3", details: err.message },
            { status: 500 }
        );
    }
}
