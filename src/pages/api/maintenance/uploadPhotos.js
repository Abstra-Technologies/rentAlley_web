import { IncomingForm } from "formidable";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { db } from "../../../lib/db";
import { encryptData } from "../../../crypto/encrypt";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

function sanitizeFilename(filename) {
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.]/g, "_") // Replaces non-alphanumeric chars with underscores
    .replace(/\s+/g, "_"); // Replaces consecutive whitespaces with a single underscore
  return sanitized;
}

export default async function handler(req, res) {
  let connection;

  try {
    connection = await db.getConnection();

    if (req.method === "POST") {
      await handlePostRequest(req, res, connection);
    } else {
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

//  file upload  to S3
async function handlePostRequest(req, res, connection) {
  const form = new IncomingForm({
    multiples: true, // Allows multiple file uploads
    keepExtensions: true, // Keeps file extensions
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(400).json({ error: "Error parsing form data" });
    }

    const { request_id } = fields;

    console.log("Fields: ", fields);

    if (!request_id) {
      return res.status(400).json({ error: "Missing request_id" });
    }

    const uploadedFiles = Object.values(files).flat();

    if (!uploadedFiles.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    try {
      await connection.beginTransaction();

      const uploadPromises = uploadedFiles.map(async (file) => {
        const filePath = file.filepath;
        const sanitizedFilename = sanitizeFilename(file.originalFilename);
        const fileName = `maintenancePhoto/${Date.now()}_${sanitizedFilename}`;
        const fileStream = fs.createReadStream(filePath);
        const photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        const encryptedUrl = JSON.stringify(
          encryptData(photoUrl, encryptionSecret)
        );

        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName,
          Body: fileStream,
          ContentType: file.mimetype,
        };

        try {
          await s3Client.send(new PutObjectCommand(uploadParams));

          return {
            request_id,
            photo_url: encryptedUrl,
          };
        } catch (uploadError) {
          console.error("Error uploading file to S3:", uploadError);
          throw new Error(
            `Failed to upload ${file.originalFilename}: ${uploadError.message}`
          );
        }
      });

      const uploadedFilesData = await Promise.all(uploadPromises);

      const values = uploadedFilesData.map((fileData) => [
        fileData.request_id,
        fileData.photo_url,
        new Date(),
        new Date(),
      ]);

      const [result] = await connection.query(
        `INSERT INTO MaintenancePhoto (request_id, photo_url, created_at, updated_at) VALUES ?`,
        [values]
      );

      await connection.commit();

      res.status(201).json({
        message: "Maintenance Photos uploaded successfully",
        insertedPhotoIDs: result.insertId,
        files: uploadedFilesData,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error saving maintenance photos:", error);
      res
        .status(500)
        .json({ error: "Failed to add maintenance photos: " + error.message });
    }
  });
}
