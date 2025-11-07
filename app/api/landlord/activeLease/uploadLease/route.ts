import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { s3 } from "@/lib/s3";
import { randomUUID } from "crypto";
import { encryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                { error: "Invalid Content-Type. Use multipart/form-data" },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const agreement_id = formData.get("agreement_id")?.toString();
        const lease_file = formData.get("lease_file") as File | null;

        if (!agreement_id || !lease_file) {
            return NextResponse.json(
                { error: "Missing required fields: agreement_id, lease_file" },
                { status: 400 }
            );
        }

        // ✅ Validate allowed file types
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(lease_file.type)) {
            return NextResponse.json(
                { error: "Only PDF or DOCX files are allowed." },
                { status: 400 }
            );
        }

        // ✅ Convert the uploaded file to a Base64 string
        const fileBuffer = Buffer.from(await lease_file.arrayBuffer());
        const base64File = fileBuffer.toString("base64");

        // ✅ Encrypt the Base64 content using your AES-256-GCM util
        const encryptedPayload = encryptData(base64File, SECRET_KEY);

        // Convert the encryption object into JSON for upload
        const encryptedJson = JSON.stringify(encryptedPayload);
        const encryptedBuffer = Buffer.from(encryptedJson, "utf8");

        // ✅ Generate unique file name
        const fileExt = lease_file.name.split(".").pop();
        const fileKey = `leases/${agreement_id}_${randomUUID()}.${fileExt}.enc`;

        // ✅ Upload encrypted file to S3
        const uploadParams = {
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: fileKey,
            Body: encryptedBuffer,
            ContentType: "application/json", // storing encrypted JSON
        };

        await s3.upload(uploadParams).promise();

        const rawUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileKey}`;

        // ✅ Encrypt the S3 URL before saving to DB
        const encryptedUrlObj = encryptData(rawUrl, SECRET_KEY);
        const encryptedUrlJson = JSON.stringify(encryptedUrlObj);

        // ✅ Update LeaseAgreement table
        await db.query(
            `UPDATE LeaseAgreement 
       SET agreement_url = ?, updated_at = NOW() 
       WHERE agreement_id = ?`,
            [encryptedUrlJson, agreement_id]
        );

        return NextResponse.json(
            {
                message: "Lease document encrypted & uploaded successfully.",
                agreement_id,
                agreement_url: rawUrl, // you can return decrypted URL for immediate UI access if needed
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Lease Document Upload Error:", error);
        return NextResponse.json(
            { error: "Failed to upload lease document." },
            { status: 500 }
        );
    }
}
