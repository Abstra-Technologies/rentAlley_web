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

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  },
});

const encryptDataString = (data) => {
  return JSON.stringify(encryptData(data, process.env.ENCRYPTION_SECRET));
};

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 15 * 1024 * 1024,
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res
        .status(500)
        .json({ error: "File parsing error", message: err.message });
    }

    const { agreement_id, paymentMethod, amountPaid, paymentType } = fields;

    console.log("Fields", fields);

    // Validate input
    if (!agreement_id || !paymentMethod || !amountPaid || !paymentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (
      !["billing", "security_deposit", "advance_rent"].includes(paymentType)
    ) {
      return res.status(400).json({ error: "Invalid payment type" });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const proofFile = files.proof || null;
      let proofUrl = null;

      const requestReferenceNumber = `PAY-${Date.now()}-${paymentType.toUpperCase()}`;

      if (["2", "3", "4"].includes(paymentMethod)) {
        if (!proofFile) {
          return res
            .status(400)
            .json({ error: "Proof of payment is required for this method" });
        }
        proofUrl = await uploadToS3(proofFile, "proofOfPayment");
      }

      const query = `
        INSERT INTO Payment 
        (agreement_id, payment_type, amount_paid, payment_method_id, payment_status, proof_of_payment, created_at, updated_at) 
        VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())`;

      await connection.execute(query, [
        agreement_id,
        paymentType,
        amountPaid,
        paymentMethod,
        proofUrl,
        requestReferenceNumber,
      ]);
      await connection.commit();

      res.status(201).json({ message: "Payment proof uploaded successfully." });
    } catch (error) {
      if (connection) await connection.rollback();
      res
        .status(500)
        .json({ error: "Internal server error", message: error.message });
    } finally {
      if (connection) connection.release();
    }
  });
}
