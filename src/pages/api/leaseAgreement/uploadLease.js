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
  if (req.method !== "POST") {
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

    console.log("Parsed Fields:", fields);
    console.log("Parsed Files:", files);

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Step 1: Get the approved prospective tenant for the unit
      const [prospectiveTenantResult] = await connection.execute(
        "SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ?",
        [unit_id]
      );

      if (prospectiveTenantResult.length === 0) {
        return res.status(400).json({
          error: "No approved prospective tenant found for this unit.",
        });
      }

      const tenant_id = prospectiveTenantResult[0].tenant_id;

      const leaseAgreementFile = files.leaseFile?.[0] || null;

      const agreementUrl = leaseAgreementFile
        ? await uploadToS3(leaseAgreementFile, "leaseAgreement")
        : null;

      const query = `
        INSERT INTO LeaseAgreement 
        (tenant_id, unit_id, agreement_url, status, created_at, updated_at) 
        VALUES (?, ?, ?, 'pending', NOW(), NOW())`;

      console.log("Inserting into MySQL with:", {
        tenant_id,
        unit_id,
        agreementUrl,
      });

      await connection.execute(query, [
        tenant_id,
        Number(unit_id),
        agreementUrl,
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
