import { db } from "../../../lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { decryptData } from "../../../crypto/encrypt";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { unit_id } = req.query;

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    // Retrieve the lease agreement file URL
    const [leaseRows] = await connection.execute(
      "SELECT agreement_url FROM LeaseAgreement WHERE unit_id = ?",
      [unit_id]
    );

    if (leaseRows.length === 0) {
      return res.status(404).json({ error: "Lease not found" });
    }

    let leaseFileUrl = leaseRows[0].agreement_url;

    try {
      leaseFileUrl = decryptData(
        JSON.parse(leaseFileUrl),
        process.env.ENCRYPTION_SECRET
      );
    } catch (decryptionError) {
      console.error("Decryption Error:", decryptionError);
      return res
        .status(500)
        .json({ error: "Failed to decrypt lease file URL." });
    }

    // Extract S3 key from the URL
    const key = new URL(leaseFileUrl).pathname.substring(1);

    // Delete the lease file from S3
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
        })
      );
    } catch (s3Error) {
      console.error("S3 Deletion Error:", s3Error);
      return res
        .status(500)
        .json({ error: "Failed to delete lease file from S3." });
    }

    // Delete lease record from the database
    const [deleteResult] = await connection.execute(
      "DELETE FROM LeaseAgreement WHERE unit_id = ?",
      [unit_id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Lease not found" });
    }

    await connection.commit();
    res.status(200).json({
      message: "Lease agreement and associated detailes deleted successfully",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error deleting lease:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
