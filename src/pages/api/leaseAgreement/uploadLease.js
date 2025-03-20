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
  return JSON.stringify(encryptData(data, process.env.ENCRYPTION_SECRET));
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
    .replace(/\s+/g, "_"); // Replace consecutive whitespaces with a single underscore
  return sanitized;
}

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

export default async function saveUploadLease(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024,
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res
        .status(500)
        .json({ error: "File parsing error", message: err.message });
    }

    const { unit_id } = fields;

    if (!unit_id || !unit_id[0]) {
      return res.status(400).json({ error: "unit_id is required" });
    }

    console.log("Parsed Fields:", fields);
    console.log("Parsed Files:", files);

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const [tenantRows] = await connection.execute(
        `SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ? AND status = 'approved' LIMIT 1`,
        [unit_id[0]]
      );

      if (tenantRows.length === 0) {
        return res
          .status(404)
          .json({ error: "No approved tenant found for this unit" });
      }

      const tenant_id = tenantRows[0].tenant_id;

      const [existingLease] = await connection.execute(
        `SELECT agreement_id FROM LeaseAgreement WHERE tenant_id = ? AND unit_id = ?`,
        [tenant_id, unit_id[0]]
      );

      if (existingLease.length === 0) {
        return res.status(404).json({ error: "Lease agreement not found" });
      }

      const leaseAgreementFile = files.leaseFile?.[0] || null;

      const agreementUrl = leaseAgreementFile
        ? await uploadToS3(leaseAgreementFile, "leaseAgreement")
        : null;

      if (!agreementUrl) {
        return res.status(400).json({ error: "No lease file uploaded" });
      }

      const query = `
        UPDATE LeaseAgreement 
        SET agreement_url = ?, updated_at = NOW() 
        WHERE agreement_id = ?
      `;

      await connection.execute(query, [
        agreementUrl,
        existingLease[0].agreement_id,
      ]);
      await connection.commit();
      res.status(201).json({ message: "Lease agreement stored successfully." });
    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  });
}
