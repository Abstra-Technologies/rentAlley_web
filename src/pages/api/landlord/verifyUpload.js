import multer from "multer";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mysql from "mysql2/promise";
import { runMiddleware } from "../../lib/middleware";
import CryptoJS from "crypto-js";

// Encryption Secret (store this securely, e.g., in environment variables)
const encryptionSecret = process.env.EMAIL_SECRET_KEY; // Load the encryption secret from environment variables

// Multer configuration
const storage = multer.diskStorage({
  // Change to diskStorage to handle file paths correctly
  destination: "./public/uploads", // Temporary directory to store uploaded files
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use original filename
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

export const config = {
  api: {
    bodyParser: false, // Disable built-in body parser
  },
};

// Configure AWS S3 client
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

  let connection; // Declare connection outside the try block

  try {
    // Run Multer middleware
    await runMiddleware(req, res, upload.single("uploadedFile"));

    const { selfie, landlord_id, documentType } = req.body;

    if (!landlord_id || !documentType) {
      return res.status(400).json({
        error: "Missing required fields: landlord_id or documentType",
      });
    }

    // Get S3 URL for the uploaded document
    const s3FileKey = `landlordDocs/${Date.now()}-${req.file.originalname}`;
    const s3FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3FileKey}`;

    // Encrypt the S3 file URL
    const encryptedS3FileUrl = CryptoJS.AES.encrypt(
      s3FileUrl,
      encryptionSecret
    ).toString();
    console.log("s3FileUrl", s3FileUrl);
    console.log("encryptedS3FileUrl", encryptedS3FileUrl);

    let s3SelfieUrl = null;
    let encryptedS3SelfieUrl = null;

    // If a selfie is provided, upload it to S3
    if (selfie) {
      const base64Data = selfie.replace(/^data:image\/jpeg;base64,/, "");
      const selfieFileName = `landlordSelfies/${Date.now()}.jpg`;
      const selfieBuffer = Buffer.from(base64Data, "base64");
      const selfieParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: selfieFileName,
        Body: selfieBuffer,
        ContentType: "image/jpeg",
      };

      const selfieCommand = new PutObjectCommand(selfieParams);
      await s3Client.send(selfieCommand);

      // Get the S3 URL for the uploaded selfie
      s3SelfieUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${selfieFileName}`;

      // Encrypt the S3 selfie URL
      encryptedS3SelfieUrl = CryptoJS.AES.encrypt(
        s3SelfieUrl,
        encryptionSecret
      ).toString();
      console.log("s3SelfieUrl", s3SelfieUrl);
      console.log("encryptedS3SelfieUrl", encryptedS3SelfieUrl);
    }

    // Upload the document to S3
    const filePath = req.file.path;
    const fileStream = fs.createReadStream(filePath);
    const fileParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3FileKey,
      Body: fileStream,
      ContentType: req.file.mimetype,
    };

    const fileCommand = new PutObjectCommand(fileParams);
    await s3Client.send(fileCommand);

    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Insert into `LandlordVerification` table
    const query = `
          INSERT INTO LandlordVerification (landlord_id, document_type, document_url, selfie_url, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
      `;
    await connection.execute(query, [
      landlord_id,
      documentType,
      encryptedS3FileUrl, // Store the encrypted S3 file URL
      encryptedS3SelfieUrl, // Store the encrypted S3 selfie URL
    ]);

    // Remove the local file to clean up
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: "Upload successful",
      fileUrl: s3FileUrl, // Return the unencrypted URL
      selfieUrl: s3SelfieUrl, // Return the unencrypted URL
    });
  } catch (error) {
    console.error("Error in upload handler:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.end(); // Close the connection in the finally block
    }
  }
}
