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

export default async function uploadPropertyVerification(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
    allowEmptyFiles: false, // Ensure files are actually uploaded
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res
        .status(500)
        .json({ error: "File parsing error", message: err.message }); // Enhanced error message
    }

    console.log("Parsed Fields:", fields);
    console.log("Parsed Files:", files);

    const { property_id } = fields;
    if (!property_id) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    let connection;
    try {
      // ✅ Get a transaction-safe connection
      connection = await db.getConnection();

      // Check if property_id exists in the Property table
      const [rows] = await connection.execute(
        "SELECT property_id FROM Property WHERE property_id = ?",
        [Number(property_id)]
      );

      if (rows.length === 0) {
        return res
          .status(400)
          .json({ error: "Invalid property_id: No matching property found" });
      }

      await connection.beginTransaction();

      const occPermitFile = files.occPermit?.[0] || null;
      const mayorPermitFile = files.mayorPermit?.[0] || null;
      const indoorFile = files.indoor?.[0] || null;
      const outdoorFile = files.outdoor?.[0] || null;
      const govIdFile = files.govID?.[0] || null;

      const occPermitUrl = occPermitFile
        ? await uploadToS3(occPermitFile, "property-docs")
        : null;
      const mayorPermitUrl = mayorPermitFile
        ? await uploadToS3(mayorPermitFile, "property-docs")
        : null;
      const indoorPhoto = indoorFile
        ? await uploadToS3(indoorFile, "property-photos/indoor")
        : null;
      const outdoorPhoto = outdoorFile
        ? await uploadToS3(outdoorFile, "property-photos/outdoor")
        : null;
      const govID = govIdFile
        ? await uploadToS3(govIdFile, "property-photos/govId")
        : null;

      // "INSERT INTO PropertyVerification (property_id, occ_permit, mayor_permit, gov_id, indoor_photo, outdoor_photo, status, created_at, updated_at, verified, attempts) VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW(), 0, 0)";

      const query =
        "INSERT INTO PropertyVerification (property_id, occ_permit, mayor_permit, gov_id, indoor_photo, outdoor_photo, status, created_at, updated_at, verified, attempts)\n" +
          "VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW(), 0, 1)\n" +
          "ON DUPLICATE KEY UPDATE \n" +
          "  occ_permit = VALUES(occ_permit), \n" +
          "  mayor_permit = VALUES(mayor_permit), \n" +
          "  gov_id = VALUES(gov_id), \n" +
          "  indoor_photo = VALUES(indoor_photo), \n" +
          "  outdoor_photo = VALUES(outdoor_photo), \n" +
          "  status = 'Pending', \n" +
          "  updated_at = NOW(), \n" +
          "  attempts = attempts + 1;\n";

      console.log("Inserting into MySQL with:", {
        property_id,
        occPermitUrl,
        mayorPermitUrl,
        govID,
        indoorPhoto,
        outdoorPhoto,
      });

      await connection.execute(query, [
        Number(property_id),
        occPermitUrl,
        mayorPermitUrl,
        govID,
        indoorPhoto,
        outdoorPhoto,
      ]);

      await connection.commit(); // ✅ Use connection.commit()
      res
        .status(201)
        .json({ message: "Files uploaded and stored successfully" });
    } catch (error) {
      if (connection) await connection.rollback(); // ✅ Use connection.rollback()
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      if (connection) connection.release(); // ✅ Release the connection
    }
  });
}
