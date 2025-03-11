import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import { db } from "../../../lib/db";
import { jwtVerify } from "jose";
import { getCookie } from "cookies-next";
import { encryptData } from "../../../crypto/encrypt";

export const config = {
    api: {
        bodyParser: false,
    },
};

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export default async function profilepictureHandler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const token = await getCookie("token", { req, res });

        if (!token) {
            console.error("[Profile Upload] No valid token found.");
            return res.status(401).json({ error: "Unauthorized" });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.user_id;

        if (!userId) {
            console.error("[Profile Upload] Invalid JWT payload.");
            return res.status(400).json({ error: "Invalid user session." });
        }

        console.log(`[Profile Upload] Authenticated User ID: ${userId}`);

        const form = formidable({
            multiples: false,
            keepExtensions: true,
        });
        const [fields, files] = await form.parse(req);

        const file = files.file[0];
        if (!file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Read file content
        const fileBuffer = await fs.readFile(file.filepath);
        const fileName = `profile-pictures/${Date.now()}-${path.basename(file.originalFilename)}`;

        // Upload to S3
        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: file.mimetype,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // Generate the S3 file URL
        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        const encryptImage = imageUrl ? JSON.stringify(encryptData(imageUrl, process.env.ENCRYPTION_SECRET)) : null;

        console.log(` [Profile Upload] File Uploaded to S3: ${imageUrl}`);

        // Store image URL in database
        await db.query("UPDATE User SET profilePicture = ? WHERE user_id = ?", [encryptImage, userId]);

        console.log(` [Profile Upload] Profile picture updated in DB for User ID: ${userId}`);

        res.status(200).json({ message: "Profile picture updated successfully!", imageUrl });
    } catch (error) {
        console.error(" [Profile Upload] Error:", error);
        res.status(500).json({ message: "Failed to upload image" });
    }
}
