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

        // ✅ Validate file type
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

        // ✅ Prepare file for upload
        const fileBuffer = Buffer.from(await lease_file.arrayBuffer());
        const fileExt = lease_file.name.split(".").pop();
        const fileKey = `leases/${agreement_id}_${randomUUID()}.${fileExt}`;

        // ✅ Upload raw file to S3 (unencrypted)
        await s3
            .upload({
                Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                Key: fileKey,
                Body: fileBuffer,
                ContentType: lease_file.type,
            })
            .promise();

        // ✅ Generate the public S3 URL
        const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileKey}`;

        // ✅ Encrypt the URL only (same pattern as property verification)
        const encryptedUrlObj = encryptData(s3Url, SECRET_KEY);
        const encryptedUrlJson = JSON.stringify(encryptedUrlObj);

        await db.query(
            `UPDATE LeaseAgreement 
         SET agreement_url = ?, updated_at = NOW() 
         WHERE agreement_id = ?`,
            [encryptedUrlJson, agreement_id]
        );

        return NextResponse.json(
            {
                message: "Lease document uploaded & URL encrypted successfully.",
                agreement_id,
                agreement_url: s3Url,
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
