import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import { db } from "../../../lib/db";
import { encryptData } from "../../../crypto/encrypt";

// AWS S3 Configuration (v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Sanitize Input Function
const sanitizeInput = (input) => {
  return input.replace(/[^a-zA-Z0-9_@. -]/g, "_"); // Replace special characters and spaces with underscores
};

export const config = {
  api: {
    bodyParser: false, // Required for Formidable to handle files
  },
};

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Parse form data
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });
    const [fields, files] = await form.parse(req);

    const { property_id } = fields;

    // Handle file upload to S3
    const file = files.file?.[0];
    if (!file) {
      return res
        .status(400)
        .json({ message: "Government ID file is required." });
    }

    const fileBuffer = await fs.readFile(file.filepath);
    const fileName = `government-ids/${Date.now()}-${path.basename(
      file.originalFilename
    )}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: sanitizeInput(fileName),
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    // Upload to S3
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate and encrypt S3 URL
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    const encryptedS3Url = JSON.stringify(
      encryptData(s3Url, process.env.ENCRYPTION_SECRET)
    );

    // Insert into ProspectiveTenant table
    await db.query(
      "UPDATE ProspectiveTenant SET government_id = ? WHERE property_id = ?",
      [encryptedS3Url, property_id]
    );

    res.status(201).json({ message: "Requirement submitted successfully!" });
  } catch (error) {
    console.error("❌ [Submit Requirements] Error:", error);
    res.status(500).json({ message: "Failed to submit requirements", error });
  }
}
