import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IncomingForm } from "formidable";
import fs from "fs";
import { encryptData } from "../../../crypto/encrypt";
import { db } from "../../../lib/db";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser to handle FormData with Formidable
  },
};

// Encrypt data before storing in DB
const encryptDataString = (data) => {
  return encryptData(data, process.env.ENCRYPTION_SECRET);
};

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function sanitizeFilename(filename) {
  // Replace special characters with underscores and remove whitespaces
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.]/g, "_") // Replace non-alphanumeric chars with underscores
    .replace(/\s+/g, "_"); // Replace consecutive whitespaces with a single underscore
  return sanitized;
}

/**
 * Upload file to S3 and return encrypted URL.
 */
const uploadToS3 = async (file, folder) => {
  if (!file || !file.filepath) {
    console.error("Filepath is missing:", file);
    return null;
  }

  console.log(
    "Uploading to S3:",
    file.filepath,
    "Original filename:",
    file.originalFilename
  );

  const fileStream = fs.createReadStream(file.filepath);
  const sanitizedFilename = sanitizeFilename(file.originalFilename);
  const fileName = `${folder}/${Date.now()}_${sanitizedFilename}`;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(params));
  const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

  return encryptDataString(s3Url);
};

/**
 * API Handler to process file upload and save encrypted links to MySQL
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB limit
    allowEmptyFiles: false, // Ensure files are actually uploaded
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res
        .status(500)
        .json({ error: "File parsing error", message: err.message }); // Enhanced error message
    }

    const { property_id, unit_id } = fields;

    let connection;
    try {
      // ✅ Get a transaction-safe connection
      connection = await db.getConnection();

      await connection.beginTransaction();

      const leaseAgreementFile = files.leaseFile?.[0] || null;

      const agreementUrl = leaseAgreementFile
        ? await uploadToS3(leaseAgreementFile, "leaseAgreement")
        : null;

      const query =
        "INSERT INTO LeaseAgreement (property_id, unit_id, agreement_url, status, created_at, updated_at) VALUES (?, ?, ?, 'Pending', NOW(), NOW())";

      console.log("Inserting into MySQL with:", {
        property_id,
        unit_id,
        agreementUrl,
      });

      await connection.execute(query, [
        Number(property_id) || null,
        Number(unit_id) || null,
        agreementUrl,
      ]);

      await connection.commit(); // ✅ Use connection.commit()
      res
        .status(201)
        .json({ message: "Files uploaded and stored successfully" });
    } catch (error) {
      if (connection) await connection.rollback(); // ✅ Use connection.rollback()
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
