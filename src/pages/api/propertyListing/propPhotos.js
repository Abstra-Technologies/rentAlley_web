import { IncomingForm } from "formidable";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import { db } from "../../../lib/db";
import { decryptData, encryptData } from "../../../crypto/encrypt";

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Encryption Secret
const encryptionSecret = process.env.ENCRYPTION_SECRET;

// API Config to disable default body parsing (important for Formidable)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Function to sanitize filenames, including special characters
function sanitizeFilename(filename) {
  // Replace special characters with underscores and remove whitespaces
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.]/g, "_") // Replace non-alphanumeric chars with underscores
    .replace(/\s+/g, "_"); // Replace consecutive whitespaces with a single underscore
  return sanitized;
}

export default async function handler(req, res) {
  let connection;

  try {
    connection = await db.getConnection();

    if (req.method === "PUT") {
      await handlePutRequest(req, res, connection);
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
async function handlePutRequest(req, res, connection) {
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

    // For Debugging
    console.log("Error from form.parse:", err);
    console.log("Fields from form.parse:", fields);
    console.log("Files from form.parse:", files);

    const { property_id } = fields;
    if (!property_id) {
      return res.status(400).json({ error: "Missing property_id" });
    }

    const uploadedFiles = Array.isArray(files.files)
      ? files.files
      : [files.files]; // Ensure we handle single & multiple files

    if (!uploadedFiles.length || !uploadedFiles[0]) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    try {
      await connection.beginTransaction();

      // 🔍 Fetch existing photo URLs from the database
      const [existingProperty] = await connection.query(
        `SELECT photo_url FROM Property WHERE property_id = ?`,
        [property_id]
      );

      let existingPhotos = [];
      if (existingProperty.length > 0 && existingProperty[0].photo_url) {
        try {
          existingPhotos = JSON.parse(existingProperty[0].photo_url); // Convert JSON to array
        } catch (error) {
          console.error("⚠️ Error parsing existing photo URLs:", error);
        }
      }

      const uploadPromises = uploadedFiles.map(async (file) => {
        const filePath = file.filepath;
        const sanitizedFilename = sanitizeFilename(file.originalFilename);
        const fileName = `propertyPhoto/${Date.now()}_${sanitizedFilename}`;
        const fileStream = fs.createReadStream(filePath);
        const photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        // Encrypt the URL
        const encryptedUrl = JSON.stringify(
          encryptData(photoUrl, encryptionSecret)
        );

        // Upload to S3
        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName,
          Body: fileStream,
          ContentType: file.mimetype,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        return encryptedUrl;
      });

      await connection.commit();

      const newPhotoUrls = await Promise.all(uploadPromises);

      // 🛠️ Merge new photos with existing ones
      const updatedPhotos = [...existingPhotos, ...newPhotoUrls];

      // ✅ Update DB with the new JSON array
      await connection.query(
        `UPDATE Property SET photo_url = ?, updated_at = ? WHERE property_id = ?`,
        [JSON.stringify(updatedPhotos), new Date(), property_id]
      );

      res.status(201).json({
        message: "Photos uploaded successfully",
        files: updatedPhotos,
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

// Fetch property photos
async function handleGetRequest(req, res, connection) {
  const { property_id } = req.query;

  try {
    // let query = `SELECT * FROM Property`;
    let query = `SELECT property_id, photo_url
      FROM Property
      WHERE 1=1`;
    let params = [];

    // if (property_id) {
    //   query += ` WHERE property_id = ? ORDER BY property_id ASC`;
    //   params.push(property_id);
    // } else {
    //   query += ` GROUP BY property_id ORDER BY property_id ASC`; // Group photos by property
    // }

    // if (landlord_id) {
    //   query += ` AND landlord_id = ?`;
    //   params.push(landlord_id);
    // }

    if (property_id) {
      query += ` AND property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await connection.execute(query, params);

    // Process the photos
    const propertiesWithPhotos = rows.map((property) => {
      let firstPhoto = null;

      try {
        console.log("Raw photo_url from DB:", property.photo_url);

        if (property.photo_url) {
          // Parse the array itself first
          const encryptedPhotoArray = JSON.parse(property.photo_url);

          if (
            Array.isArray(encryptedPhotoArray) &&
            encryptedPhotoArray.length > 0
          ) {
            const decryptedPhotos = encryptedPhotoArray
              .map((encryptedStr) => {
                try {
                  // Each element in the array is a **stringified object**, so parse it first!
                  const encryptedData = JSON.parse(encryptedStr);
                  return decryptData(encryptedData, encryptionSecret);
                } catch (decryptErr) {
                  console.error(
                    "Error decrypting individual photo:",
                    decryptErr
                  );
                  return null;
                }
              })
              .filter(Boolean); // Remove null values from failed decryptions

            firstPhoto = decryptedPhotos.length > 0 ? decryptedPhotos[0] : null;
          }
        }
      } catch (error) {
        console.error("Error parsing or decrypting photo_url:", error);
      }

      return { ...property, firstPhoto };
    });

    // Decrypt the photo URLs before returning them
    // const decryptedRows = rows.map((row) => {
    //   try {
    //     const encryptedData = JSON.parse(row.photo_url);
    //     const decryptedUrl = decryptData(encryptedData, encryptionSecret);

    //     return {
    //       ...row,
    //       photo_url: decryptedUrl,
    //     };
    //   } catch (decryptionError) {
    //     console.error("Decryption Error:", decryptionError);
    //     return {
    //       ...row,
    //       // photo_url: null,
    //       photo_url: [],
    //     };
    //   }
    // });

    res.status(200).json(propertiesWithPhotos);
  } catch (error) {
    console.error("Error fetching property photos:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch property photos: " + error.message });
  }
}

// Delete property photo (Also delete from S3)
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
