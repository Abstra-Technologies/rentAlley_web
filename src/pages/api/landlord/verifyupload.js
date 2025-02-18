import formidable from "formidable";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mysql from "mysql2/promise";
import CryptoJS from "crypto-js";

export const config = {
  api: {
    bodyParser: false, // 🚀 Must be disabled when using Formidable
  },
};
// AWS S3 Client Setup
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let connection;

  try {
    const form = new formidable.IncomingForm({
      multiples: true, // Allows multiple file uploads
      keepExtensions: true, // Keeps file extensions
      maxFileSize: 20 * 1024 * 1024, // ✅ Set max file size to 20MB
    });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Formidable Error:", err);
        return res.status(500).json({ error: "Error parsing form data" });
      }

      const { landlord_id, address, nationality, documentType } = fields;

      const encryptionSecret = process.env.EMAIL_SECRET_KEY;
      let encryptedS3FileUrl = null;
      let encryptedS3SelfieUrl = null;
      let s3FileUrl = null;
      let s3SelfieUrl = null;

      if (files.uploadedFile) {
        const file = files.uploadedFile;
        const fileExt = path.extname(file.originalFilename).toLowerCase();
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];

        if (!allowedExtensions.includes(fileExt)) {
          return res.status(400).json({ error: "Invalid file type" });
        }

        const s3FileKey = `landlordVerificationDoc/${Date.now()}-${file.originalFilename}`;
        const fileStream = fs.createReadStream(file.filepath);
        const fileParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3FileKey,
          Body: fileStream,
          ContentType: file.mimetype,
        };

        await s3Client.send(new PutObjectCommand(fileParams));

        s3FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3FileKey}`;
        encryptedS3FileUrl = CryptoJS.AES.encrypt(s3FileUrl, encryptionSecret).toString();

        // Cleanup temporary file
        fs.unlinkSync(file.filepath);
      }

      // Upload selfie if provided
      if (files.selfie) {
        const selfieFile = files.selfie;
        const selfieKey = `landlordSelfies/${Date.now()}.jpg`;
        const selfieStream = fs.createReadStream(selfieFile.filepath);
        const selfieParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: selfieKey,
          Body: selfieStream,
          ContentType: "image/jpeg",
        };

        await s3Client.send(new PutObjectCommand(selfieParams));

        s3SelfieUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${selfieKey}`;
        encryptedS3SelfieUrl = CryptoJS.AES.encrypt(s3SelfieUrl, encryptionSecret).toString();

        fs.unlinkSync(selfieFile.filepath);
      }

      // Connect to MySQL
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

      // Insert into `LandlordVerification` table
      await connection.execute(
          `INSERT INTO LandlordVerification 
         (landlord_id, document_type, document_url, selfie_url, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
          [landlord_id, documentType, encryptedS3FileUrl, encryptedS3SelfieUrl]
      );

      await connection.execute(
          `UPDATE Landlord SET address = ?, nationality = ?, updatedAt = NOW() WHERE landlord_id = ?`,
          [address, nationality, landlord_id]
      );

      res.status(200).json({
        message: "Upload successful",
        fileUrl: s3FileUrl,
        selfieUrl: s3SelfieUrl,
      });
    });
  } catch (error) {
    console.error("Error in upload handler:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
