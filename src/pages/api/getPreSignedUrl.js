import AWS from "aws-sdk";

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: "v4"
});

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { key } = req.query; // File key (S3 path)

    if (!key) {
        return res.status(400).json({ message: "Missing file key" });
    }

    try {
        // Generate a pre-signed URL (valid for 10 minutes)
        const url = await s3.getSignedUrlPromise("getObject", {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: decodeURIComponent(key), // Ensure correct key formatting
            Expires: 600 // 10 minutes
        });

        res.status(200).json({ url });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({ message: "Error generating signed URL" });
    }
}
