import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { generateProspectiveTenantId } from "@/utils/id_generator";

const s3 = new S3Client({
  region: process.env.NEXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

// 🔹 Web Push Configuration
webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

async function uploadToS3(file: File, folder: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitizedName = sanitizeFilename(file.name);
  const fileName = `${folder}/${Date.now()}-${sanitizedName}`;
  await s3.send(
      new PutObjectCommand({
        Bucket: process.env.NEXT_S3_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
  );
  return `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
}

/** ───────────────────────────────
 *  Error Handling Helpers
 *  ─────────────────────────────── */
class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(message: string, status = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function errorResponse(err: unknown, fallbackMessage = "Unexpected error") {
  if (err instanceof AppError) {
    return NextResponse.json(
        { error: { code: err.code, message: err.message, details: err.details ?? null } },
        { status: err.status }
    );
  }
  const anyErr = err as any;
  const code = anyErr?.code || "INTERNAL_ERROR";
  const message = anyErr?.message || fallbackMessage;
  return NextResponse.json({ error: { code, message } }, { status: 500 });
}

/** ───────────────────────────────
 *  Unique ProspectiveTenant ID Generator
 *  (no retry limit — loops until unique)
 *  ─────────────────────────────── */
async function generateUniqueProspectiveId(conn: any): Promise<string> {
  while (true) {
    const candidate = generateProspectiveTenantId();
    const [rows]: any = await conn.execute(
        "SELECT 1 FROM ProspectiveTenant WHERE id = ? LIMIT 1",
        [candidate]
    );
    if (rows.length === 0) return candidate;
  }
}

export async function POST(req: NextRequest) {
  let connection: any | null = null;

  try {
    const formData = await req.formData();

    const user_id = formData.get("user_id")?.toString();
    const tenant_id = formData.get("tenant_id")?.toString();
    const unit_id = formData.get("unit_id")?.toString();
    const address = formData.get("address")?.toString();
    const occupation = formData.get("occupation")?.toString();
    const employment_type = formData.get("employment_type")?.toString();
    const monthly_income = formData.get("monthly_income")?.toString();
    const birthDate = formData.get("birthDate");
    const phoneNumber = formData.get("phoneNumber");

    const validIdFile = formData.get("valid_id") as File | null;
    const incomeFile = formData.get("income_proof") as File | null;

    // 🔒 Validate required fields
    if (
        !user_id ||
        !tenant_id ||
        !unit_id ||
        !address ||
        !occupation ||
        !employment_type ||
        !monthly_income
    ) {
      throw new AppError("Missing required fields.", 400, "INVALID_INPUT");
    }

    // 🔐 Encrypt sensitive data
    const encryptedPhone = JSON.stringify(
        encryptData(phoneNumber?.toString() || "", process.env.ENCRYPTION_SECRET!)
    );
    const encryptedBirthDate = JSON.stringify(
        encryptData(birthDate?.toString() || "", process.env.ENCRYPTION_SECRET!)
    );

    // 🗂️ Upload files to S3 (no DB state yet)
    let validIdUrl: string | null = null;
    let incomeProofUrl: string | null = null;

    if (validIdFile) {
      const url = await uploadToS3(validIdFile, "validIdTenant");
      validIdUrl = JSON.stringify(encryptData(url, process.env.ENCRYPTION_SECRET!));
    }
    if (incomeFile) {
      const url = await uploadToS3(incomeFile, "incomeProofTenant");
      incomeProofUrl = JSON.stringify(encryptData(url, process.env.ENCRYPTION_SECRET!));
    }

    // 🔁 DB Transaction
    connection = await db.getConnection();
    await connection.beginTransaction();

    // ✅ Update User
    await connection.execute(
        `UPDATE User
         SET address = ?, occupation = ?, birthDate = ?, phoneNumber = ?, updatedAt = NOW()
         WHERE user_id = ?`,
        [address, occupation, encryptedBirthDate, encryptedPhone, user_id]
    );

    // ✅ Update Tenant
    await connection.execute(
        `UPDATE Tenant
         SET employment_type = ?, monthly_income = ?, updatedAt = NOW()
         WHERE tenant_id = ?`,
        [employment_type, monthly_income, tenant_id]
    );

    // 🔍 Check existing ProspectiveTenant
    const [existing]: any = await connection.execute(
        `SELECT id FROM ProspectiveTenant WHERE tenant_id = ? AND unit_id = ? LIMIT 1`,
        [tenant_id, unit_id]
    );

    if (existing.length > 0) {
      // ♻️ Idempotent update
      await connection.execute(
          `UPDATE ProspectiveTenant
           SET valid_id = COALESCE(?, valid_id),
               proof_of_income = COALESCE(?, proof_of_income),
               updated_at = NOW()
           WHERE tenant_id = ? AND unit_id = ?`,
          [validIdUrl, incomeProofUrl, tenant_id, unit_id]
      );
    } else {
      // 🆕 Generate unique ID and insert
      const prospectiveId = await generateUniqueProspectiveId(connection);
      await connection.execute(
          `INSERT INTO ProspectiveTenant (id, tenant_id, unit_id, valid_id, proof_of_income, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
          [prospectiveId, tenant_id, unit_id, validIdUrl, incomeProofUrl]
      );
    }

    // ✅ Fetch landlord for notification
    const [landlordData]: any = await connection.execute(
        `
          SELECT
            u_landlord.user_id AS landlord_user_id,
            p.property_name,
            un.unit_name
          FROM Unit un
                 JOIN Property p ON un.property_id = p.property_id
                 JOIN Landlord l ON p.landlord_id = l.landlord_id
                 JOIN User u_landlord ON l.user_id = u_landlord.user_id
          WHERE un.unit_id = ?
          LIMIT 1
        `,
        [unit_id]
    );

    let landlordUserId: string | null = null;
    let propertyName = "Property";
    let unitName = "Unit";
    let url = `/pages/landlord/property-listing/view-unit/tenant-req/${unit_id}`;

    if (landlordData.length > 0) {
      landlordUserId = landlordData[0].landlord_user_id;
      propertyName = landlordData[0].property_name || propertyName;
      unitName = landlordData[0].unit_name || unitName;

      const title = "New Tenant Application";
      const body = `A tenant has submitted an application for ${propertyName} – ${unitName}.`;

      await connection.execute(
          `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
           VALUES (?, ?, ?, ?, 0, NOW())`,
          [landlordUserId, title, body, url]
      );
    }

    // ✅ Commit transaction
    await connection.commit();

    // 🌐 Send Web Push (after commit)
    if (landlordUserId) {
      try {
        const [subscriptions]: any = await db.query(
            `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
            [landlordUserId]
        );

        if (subscriptions.length > 0) {
          const payload = JSON.stringify({
            title: "New Tenant Application",
            body: `A tenant has submitted an application for ${propertyName} – ${unitName}.`,
            url: `${process.env.NEXT_PUBLIC_BASE_URL}${url}`,
            icon: `${process.env.NEXT_PUBLIC_BASE_URL}/icons/notification-icon.png`,
          });

          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                  },
                  payload
              );
            } catch (err: any) {
              console.warn("❌ Web Push failed:", err?.message || err);
            }
          }
        }
      } catch (pushErr: any) {
        console.warn("⚠️ Push lookup failed:", pushErr?.message || pushErr);
      }
    }

    return NextResponse.json({ message: "Application submitted successfully!" }, { status: 201 });
  } catch (error: any) {
    // 🧩 Rollback transaction if needed
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error("Rollback failed:", rbErr);
      } finally {
        connection.release();
      }
      connection = null;
    }
    console.error("[Submit Application] Error:", error);
    return errorResponse(error, "Failed to submit application");
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch {
        /* ignore */
      }
    }
  }
}
