import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const { fileUrl } = await req.json();

        if (!fileUrl) {
            return NextResponse.json({ error: "File URL is required." }, { status: 400 });
        }

        const bucket = process.env.NEXT_S3_BUCKET_NAME!;
        const region = process.env.NEXT_AWS_REGION!;

        // Extract S3 object key from URL
        const key = decodeURIComponent(
            fileUrl.split(`${bucket}.s3.${region}.amazonaws.com/`)[1] ||
            fileUrl.split("/").pop()!
        );

        if (!key) {
            return NextResponse.json({ error: "Invalid file URL format." }, { status: 400 });
        }

        console.log(`🗑️ Deleting file from S3: ${key}`);

        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );

        return NextResponse.json({
            success: true,
            message: "File deleted successfully from S3.",
        });
    } catch (err: any) {
        console.error("S3 Delete Error:", err);
        return NextResponse.json(
            { error: "Failed to delete file from S3", details: err.message },
            { status: 500 }
        );
    }
}
