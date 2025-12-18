import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
},
});


export async function deleteFromS3(fileUrl: string) {
    const bucket = process.env.NEXT_S3_BUCKET_NAME!;

    const key = decodeURIComponent(
        new URL(fileUrl).pathname.replace(/^\/+/, "")
    );

    await s3.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );

    console.log("✅ S3 deleted:", key);
}

export async function uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string
) {
    const bucket = process.env.NEXT_S3_BUCKET_NAME!;

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );

    return `https://${bucket}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}
