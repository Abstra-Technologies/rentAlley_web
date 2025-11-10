import AWS from "aws-sdk";

const s3 = new AWS.S3({
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_AWS_REGION,
});

export { s3 };

// ✅ Plain JS version (no type annotations)
export const uploadToS3 = async (buffer, fileName, mimeType, folderPath) => {
    const bucket = process.env.NEXT_S3_BUCKET_NAME;
    const safeName = fileName.replace(/\s+/g, "_");
    const keyPrefix = folderPath ? `${folderPath}/` : "";
    const key = `${keyPrefix}${Date.now()}-${safeName}`;

    const params = {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    };

    const { Location } = await s3.upload(params).promise();
    return Location;
};

export const deleteFromS3 = async (fileUrl) => {
    try {
        if (!fileUrl) return;
        const bucketName = process.env.NEXT_S3_BUCKET_NAME;
        const key = fileUrl.split(".amazonaws.com/")[1];
        await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
    } catch (error) {
        console.error("❌ S3 Delete Error:", error);
    }
};
