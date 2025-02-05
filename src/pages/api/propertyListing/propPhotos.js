import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { db } from "../../lib/db";
import { runMiddleware } from "../../lib/middleware";
import path from "path";
import CryptoJS from "crypto-js"; // Import CryptoJS for encryption

// Import the encrypt/decrypt functions from the specified path
import { decryptData } from "../../crypto/encrypt";

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Encryption Secret (store this securely, e.g., in environment variables)
const encryptionSecret = process.env.EMAIL_SECRET_KEY; // Load the encryption secret from environment variables

// Multer configuration
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

// API Config
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
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

// Handle multiple file uploads to S3
async function handlePostRequest(req, res, connection) {
  try {
    await runMiddleware(req, res, upload.array("files", 5));
  } catch (e) {
    return res.status(500).json({ error: "File upload error: " + e.message });
  }

  const { property_id } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    await connection.beginTransaction();

    const uploadPromises = files.map(async (file) => {
      const key = `propertyPhoto/${Date.now()}_${file.originalname}`;
      const photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      // Log the URL before encryption
      console.log("Before Encryption - photoUrl:", photoUrl);
      console.log("Before Encryption - encryptionSecret:", encryptionSecret);

      // Encrypt the URL using CryptoJS
      const encryptedUrl = CryptoJS.AES.encrypt(
        photoUrl,
        encryptionSecret
      ).toString();

      // Log the encrypted URL
      console.log("After Encryption - encryptedUrl:", encryptedUrl);

      // Upload the encrypted file to S3
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer, // Keep the original file buffer
        ContentType: file.mimetype,
      };

      try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        return {
          property_id,
          photo_url: encryptedUrl, // Store the encrypted URL
        };
      } catch (uploadError) {
        console.error("Error uploading file to S3:", uploadError);
        throw new Error(
          `Failed to upload ${file.originalname}: ${uploadError.message}`
        );
      }
    });

    const uploadedFilesData = await Promise.all(uploadPromises);

    const values = uploadedFilesData.map((fileData) => [
      fileData.property_id,
      fileData.photo_url, // Store the encrypted URL in the database
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
}

// Fetch property photos
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

    // Decrypt the photo URLs before returning them to the client
    const decryptedRows = rows.map((row) => {
      // Log before decryption
      console.log("Before Decryption - encryptedUrl (from DB):", row.photo_url);
      console.log("Before Decryption - encryptionSecret:", encryptionSecret);

      try {
        // Decrypt the photo_url using the decryptData function
        const decryptedUrl = decryptData(row.photo_url);

        // Log the decrypted URL
        console.log("After Decryption - decryptedUrl:", decryptedUrl);

        return {
          ...row,
          photo_url: decryptedUrl,
        };
      } catch (decryptionError) {
        console.error("Decryption Error:", decryptionError);
        // Handle decryption error appropriately, e.g., return a default value
        return {
          ...row,
          photo_url: null, // Or some default value
        };
      }
    });

    res.status(200).json(decryptedRows); // Send the decrypted data to the client
  } catch (error) {
    console.error("Error fetching property photos:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch property photos: " + error.message });
  }
}

// Delete property photo (Also delete from S3)
async function handleDeleteRequest(req, res, connection) {
  const { photoID } = req.query;

  try {
    const [rows] = await connection.execute(
      `SELECT photo_url FROM PropertyPhoto WHERE photo_id = ?`,
      [photoID]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Photo not found" });
    }

    let photo_url = rows[0].photo_url;
    if (!photo_url) {
      return res.status(400).json({ error: "photo_url is missing" });
    }

    try {
      // Decrypt the photo_url
      photo_url = decryptData(photo_url);
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
          [photoID]
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
