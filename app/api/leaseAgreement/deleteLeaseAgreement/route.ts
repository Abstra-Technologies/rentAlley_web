import { db } from "@/lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.NEXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(req: NextRequest) {
  const unit_id = req.nextUrl.searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json({ error: "unit_id is required" }, { status: 400 });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔑 Get lease (keep it, just clear file)
    const [leaseRows]: any = await connection.execute(
        "SELECT agreement_url, agreement_id, tenant_id FROM LeaseAgreement WHERE unit_id = ? LIMIT 1",
        [unit_id]
    );

    if (!leaseRows || leaseRows.length === 0) {
      connection.release();
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const lease = leaseRows[0];
    const tenant_id = lease.tenant_id;

    // If no URL, nothing to delete
    if (!lease.agreement_url) {
      connection.release();
      return NextResponse.json({
        success: true,
        message: "No lease file attached to delete",
      });
    }

    // 🔓 Decrypt file URL
    let leaseFileUrl: string;
    try {
      leaseFileUrl = decryptData(
          JSON.parse(lease.agreement_url), // remove JSON.parse if you store raw ciphertext
          process.env.ENCRYPTION_SECRET!
      );
    } catch (decryptionError) {
      connection.release();
      console.error("Decryption Error:", decryptionError);
      return NextResponse.json(
          { error: "Failed to decrypt lease file URL." },
          { status: 500 }
      );
    }

    // 🗑️ Delete from S3
    try {
      const s3Key = new URL(leaseFileUrl).pathname.substring(1);
      await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: s3Key,
          })
      );
    } catch (s3Error) {
      connection.release();
      console.error("S3 Deletion Error:", s3Error);
      return NextResponse.json(
          { error: "Failed to delete lease file from S3." },
          { status: 500 }
      );
    }

    // ❌ Clear only the URL (keep lease record!)
    await connection.execute(
        "UPDATE LeaseAgreement SET agreement_url = NULL WHERE agreement_id = ?",
        [lease.agreement_id]
    );

    await connection.commit();
    connection.release();

    return NextResponse.json({
      success: true,
      unit_id,
      tenant_id,
      message: "Lease file deleted successfully, record kept",
    });
  } catch (error: any) {
    if (connection) await connection.rollback();
    if (connection) connection.release?.();
    console.error("Error deleting lease file:", error);
    return NextResponse.json(
        { error: "Internal server error", message: error.message },
        { status: 500 }
    );
  }
}
