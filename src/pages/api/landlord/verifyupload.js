import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IncomingForm } from "formidable";
import { db } from "../../lib/db";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (file, folder) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.filepath) {
      console.error("Filepath is missing:", file);
      return reject(new Error("Filepath is missing"));
    }

    console.log(`Uploading ${file.originalFilename} to S3...`);

    const fileStream = fs.createReadStream(file.filepath);
    const fileName = `${folder}/${Date.now()}_${file.originalFilename.replace(/\s+/g, "_")}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: fileStream,
      ContentType: file.mimetype,
    };

    s3.send(new PutObjectCommand(params))
        .then(() => {
          const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
          resolve(s3Url);
        })
        .catch((err) => reject(err));
  });
};

const uploadBase64ToS3 = async (base64String, folder) => {
  return new Promise((resolve, reject) => {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${folder}/${Date.now()}_selfie.jpg`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
    };

    s3.send(new PutObjectCommand(params))
        .then(() => {
          const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
          resolve(s3Url);
        })
        .catch((err) => reject(err));
  });
};

export default async function uploadLandlordDocs(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
    allowEmptyFiles: false,
  });

  await form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: "File parsing error", message: err.message });
    }

    console.log("Parsed Fields:", fields);
    console.log("Parsed Files:", files);

    const { landlord_id, selfie } = fields;
    const documentType = fields.documentType?.[0] || null;
    const address = fields.address?.[0] || null;
    const citizenship = fields.citizenship?.[0] || null;

    if (!landlord_id || !documentType) {
      return res.status(400).json({ error: "Missing landlord ID or document type" });
    }

    let connection;
    try {
      connection = await db.getConnection();

      // Check if landlord_id exists
      const [rows] = await connection.execute(
          "SELECT landlord_id FROM Landlord WHERE landlord_id = ?",
          [Number(landlord_id)]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: "Invalid landlord_id: No matching record found" });
      }

      await connection.beginTransaction();

      const documentFile = files.uploadedFile?.[0] || null;
      let documentUrl = null;
      let selfieUrl = null;

      if (documentFile) {
        documentUrl = await uploadToS3(documentFile, "landlord-docs");
      } else {
        return res.status(400).json({ error: "Document upload is required" });
      }

      if (selfie && selfie[0].startsWith("data:image")) {
        selfieUrl = await uploadBase64ToS3(selfie[0], "landlord-selfies");
      } else {
        return res.status(400).json({ error: "Invalid selfie format. Must be a Base64 image." });
      }

      // Insert into LandlordVerification
      const verificationQuery = `
        INSERT INTO LandlordVerification (landlord_id, document_type, document_url, selfie_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`;

      console.log("Inserting into MySQL:", { landlord_id, documentType, documentUrl, selfieUrl });

      await connection.execute(verificationQuery, [Number(landlord_id), documentType, documentUrl, selfieUrl]);

      // ✅ Update Landlord's Address and Citizenship
      if (address && citizenship) {
        const updateLandlordQuery = `
          UPDATE Landlord 
          SET address = ?, citizenship = ?, updatedAt = NOW()
          WHERE landlord_id = ?`;

        console.log("Updating Landlord Table:", { landlord_id, address, citizenship });

        await connection.execute(updateLandlordQuery, [address, citizenship, Number(landlord_id)]);
      }

      await connection.commit(); // ✅ Commit transaction

      res.status(201).json({ message: "Files uploaded and landlord info updated successfully", documentUrl, selfieUrl });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  });
}

