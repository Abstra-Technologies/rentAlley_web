import { IncomingForm } from "formidable";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import { db } from "../../../lib/db";
import { decryptData, encryptData } from "../../../crypto/encrypt";

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
    .replace(/[^a-zA-Z0-9.]/g, "_") // Replace non-alphanumeric chars with underscores
    .replace(/\s+/g, "_"); // Replace consecutive whitespaces with a single underscore
  return sanitized;
}

export default async function propPhotos(req, res) {
  let connection;

  try {
    connection = await db.getConnection();

    if (req.method === "POST") {
      await handlePostRequest(req, res, connection);
    } else if (req.method === "GET") {
      await handleGetRequest(req, res, connection);
    } else if (req.method === "DELETE") {
      await handleDeleteRequest(req, res, connection);
    } else {
      res.setHeader("Allow", ["POST", "GET", "DELETE"]);
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

// Handle file upload and save to S3
async function handlePostRequest(req, res, connection) {
  const form = new IncomingForm({
    multiples: true, // Allows multiple file uploads
    keepExtensions: true, // Keeps file extensions
    maxFileSize: 10 * 1024 * 1024, // 5MB limit per file
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(400).json({ error: "Error parsing form data" });
    }

    console.log("Error from form.parse:", err);
    console.log("Fields from form.parse:", fields);
    console.log("Files from form.parse:", files);

    const { property_id } = fields;
    if (!property_id) {
      return res.status(400).json({ error: "Missing property_id" });
    }

    const uploadedFiles = Object.values(files).flat();
    console.log("📂 Reformatted Uploaded Files:", uploadedFiles);

    if (!uploadedFiles.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    try {
      await connection.beginTransaction();

      const uploadPromises = uploadedFiles.map(async (file) => {
        const filePath = file.filepath;
        const sanitizedFilename = sanitizeFilename(file.originalFilename);
        const fileName = `propertyPhoto/${Date.now()}_${sanitizedFilename}`;
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
            property_id,
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
        fileData.property_id,
        fileData.photo_url,
        new Date(),
        new Date(),
      ]);

      const [result] = await connection.query(
        `INSERT INTO PropertyPhoto (property_id, photo_url, created_at, updated_at) VALUES ?`,
        [values]
      );

      await connection.commit();

      res.status(201).json({
        message: "Photos uploaded successfully",
        insertedPhotoIDs: result.insertId,
        files: uploadedFilesData,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error saving property photos:", error);
      res
        .status(500)
        .json({ error: "Failed to add property photos: " + error.message });
    }
  });
}

async function handleGetRequest(req, res, connection) {
  const { property_id } = req.query;

  try {
    let query = `SELECT * FROM PropertyPhoto`;
    let params = [];

    if (property_id) {
      query += ` WHERE property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await connection.execute(query, params);

    const decryptedRows = rows.map((row) => {
      try {
        const encryptedData = JSON.parse(row.photo_url);
        const decryptedUrl = decryptData(encryptedData, encryptionSecret);

        return {
          ...row,
          photo_url: decryptedUrl,
        };
      } catch (decryptionError) {
        console.error("Decryption Error:", decryptionError);
        return {
          ...row,
          photo_url: null,
        };
      }
    });

    res.status(200).json(decryptedRows);
  } catch (error) {
    console.error("Error fetching property photos:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch property photos: " + error.message });
  }
}

async function handleDeleteRequest(req, res, connection) {
  const { photo_id } = req.query;

  try {
    const [rows] = await connection.execute(
      `SELECT photo_url FROM PropertyPhoto WHERE photo_id = ?`,
      [photo_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Photo not found" });
    }

    let photo_url = rows[0].photo_url;

    try {
      photo_url = decryptData(JSON.parse(photo_url), encryptionSecret);
    } catch (decryptionError) {
      console.error("Decryption Error:", decryptionError);
      return res.status(500).json({ error: "Failed to decrypt photo URL." });
    }

    try {
      const key = new URL(photo_url).pathname.substring(1);

      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      };

      try {
        await s3Client.send(new DeleteObjectCommand(deleteParams));

        await connection.execute(
          `DELETE FROM PropertyPhoto WHERE photo_id = ?`,
          [photo_id]
        );

        res.status(200).json({ message: "Photo deleted successfully" });
      } catch (deleteError) {
        console.error("Error deleting from S3:", deleteError);
        return res.status(500).json({
          error: "Failed to delete photo from S3: " + deleteError.message,
        });
      }
    } catch (urlError) {
      console.error("URL Error:", urlError);
      return res.status(500).json({ error: "Invalid URL after decryption." });
    }
  } catch (error) {
    console.error("Error deleting property photo:", error);
    res
      .status(500)
      .json({ error: "Failed to delete property photo: " + error.message });
  }
}
