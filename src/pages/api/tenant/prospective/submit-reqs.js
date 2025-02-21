import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import { db } from "../../../lib/db";
import { encryptData } from "../../../crypto/encrypt";
import { IncomingForm } from "formidable";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser for FormData handling
  },
};

// Sanitize file names while preserving extension
function sanitizeInput(filename) {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper to parse form data with formidable as a promise
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 15 * 1024 * 1024, // 15MB limit
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Parse the incoming form
    const { fields, files } = await parseForm(req);
    console.log("Parsed Fields:", fields);
    console.log("Parsed Files:", files);

    // Extract property_id (if it's in an array, take the first element)
    const property_id = Array.isArray(fields.property_id)
      ? fields.property_id[0]
      : fields.property_id;

    if (!property_id) {
      return res.status(400).json({ message: "Property ID is required." });
    }

    // Retrieve the file. Ensure the form field name is 'file'
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res
        .status(400)
        .json({ message: "Government ID file is required." });
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);
    const sanitizedFilename = sanitizeInput(file.originalFilename);
    const fileName = `governmentIds/${Date.now()}-${sanitizedFilename}`;

    // Prepare S3 upload parameters
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    // Upload file to S3
    await s3.send(new PutObjectCommand(uploadParams));

    // Generate S3 URL and encrypt it
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    const encryptedS3Url = JSON.stringify(
      encryptData(s3Url, process.env.ENCRYPTION_SECRET)
    );

    // Update the ProspectiveTenant table with the encrypted URL
    const [result] = await db.query(
      "UPDATE ProspectiveTenant SET government_id = ? WHERE property_id = ?",
      [encryptedS3Url, property_id]
    );

    // Check if the update affected any rows
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No request found to update." });
    }

    res.status(201).json({ message: "Requirement submitted successfully!" });
  } catch (error) {
    console.error("❌ [Submit Requirements] Error:", error);
    res
      .status(500)
      .json({ message: "Failed to submit requirements", error: error.message });
  }
}
