import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IncomingForm } from "formidable";
import fs from "fs";
import { encryptData } from "../../../crypto/encrypt";
import { db } from "../../../lib/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

const encryptDataString = (data) => {
  return encryptData(data, process.env.ENCRYPTION_SECRET);
};

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function sanitizeFilename(filename) {
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.]/g, "_")
    .replace(/\s+/g, "_");
  return sanitized;
}

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
        .json({ error: "File parsing error", message: err.message });
    }

    console.log("Parsed Fields:", fields);
    console.log("Parsed Files:", files);

    const { property_id } = fields;
    if (!property_id) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    let connection;
    try {
      connection = await db.getConnection();

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
      const propTitleFile = files.propTitle?.[0] || null;

      const occPermitUrl = occPermitFile
        ? await uploadToS3(occPermitFile, "property-doc")
        : null;
      const mayorPermitUrl = mayorPermitFile
        ? await uploadToS3(mayorPermitFile, "property-doc")
        : null;
      const indoorPhoto = indoorFile
        ? await uploadToS3(indoorFile, "property-photo/indoor")
        : null;
      const outdoorPhoto = outdoorFile
        ? await uploadToS3(outdoorFile, "property-photo/outdoor")
        : null;
      const govID = govIdFile
        ? await uploadToS3(govIdFile, "property-photo/govId")
        : null;
      const propTitle = propTitleFile
        ? await uploadToS3(propTitleFile, "property-doc")
        : null;

      const query =
        "INSERT INTO PropertyVerification (property_id, occ_permit, mayor_permit, gov_id, property_title, indoor_photo, outdoor_photo, status, created_at, updated_at, verified, attempts)\n" +
        "VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW(), 0, 1)\n" +
        "ON DUPLICATE KEY UPDATE \n" +
        "  occ_permit = VALUES(occ_permit), \n" +
        "  mayor_permit = VALUES(mayor_permit), \n" +
        "  gov_id = VALUES(gov_id), \n" +
        "  property_title = VALUES(property_title), \n" +
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
        propTitle,
        indoorPhoto,
        outdoorPhoto,
      });

      await connection.execute(query, [
        Number(property_id),
        occPermitUrl,
        mayorPermitUrl,
        govID,
        propTitle,
        indoorPhoto,
        outdoorPhoto,
      ]);

      await connection.commit();
      res
        .status(201)
        .json({ message: "Files uploaded and stored successfully" });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  });
}
