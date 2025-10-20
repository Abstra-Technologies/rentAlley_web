import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

const s3 = new S3Client({
  region: process.env.NEXT_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
  },
});

// 🔹 Configure Web Push (VAPID keys)
webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
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
    const validIdFile = formData.get("valid_id") as File | null;
    const incomeFile = formData.get("income_proof") as File | null;
    const phoneNumber = formData.get("phoneNumber");

    if (
        !user_id ||
        !tenant_id ||
        !unit_id ||
        !address ||
        !occupation ||
        !employment_type ||
        !monthly_income
    ) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }
    const encryptedPhone = JSON.stringify(encryptData(phoneNumber?.toString() || "", process.env.ENCRYPTION_SECRET!));
    const encryptedBirthDate = JSON.stringify(encryptData(birthDate?.toString() || "", process.env.ENCRYPTION_SECRET!));

    await db.query(
        `UPDATE User
         SET
           address = ?,
           occupation = ?,
           birthDate = ?,
           phoneNumber = ?,
           updatedAt = NOW()
         WHERE user_id = ?`,
        [address, occupation, encryptedBirthDate, encryptedPhone, user_id]
    );

    await db.query(
        `UPDATE Tenant
         SET employment_type = ?, monthly_income = ?, updatedAt = NOW()
         WHERE tenant_id = ?`,
        [employment_type, monthly_income, tenant_id]
    );

    let validIdUrl: string | null = null;
    let incomeProofUrl: string | null = null;

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

    if (validIdFile) {
      const url = await uploadToS3(validIdFile, "validIdTenant");
      validIdUrl = JSON.stringify(encryptData(url, process.env.ENCRYPTION_SECRET!));
    }

    if (incomeFile) {
      const url = await uploadToS3(incomeFile, "incomeProofTenant");
      incomeProofUrl = JSON.stringify(encryptData(url, process.env.ENCRYPTION_SECRET!));
    }

    const [existing]: any = await db.query(
        `SELECT id FROM ProspectiveTenant WHERE tenant_id = ? AND unit_id = ?`,
        [tenant_id, unit_id]
    );

    if (existing.length > 0) {
      await db.query(
          `UPDATE ProspectiveTenant
           SET valid_id = COALESCE(?, valid_id),
               proof_of_income = COALESCE(?, proof_of_income),
               updated_at = NOW()
           WHERE tenant_id = ? AND unit_id = ?`,
          [validIdUrl, incomeProofUrl, tenant_id, unit_id]
      );
    } else {
      await db.query(
          `INSERT INTO ProspectiveTenant (tenant_id, unit_id, valid_id, proof_of_income, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
          [tenant_id, unit_id, validIdUrl, incomeProofUrl]
      );
    }

    // ✅ Fetch landlord + property/unit info
    const [landlordData]: any = await db.query(
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

    if (landlordData.length > 0) {
      const landlordUserId = landlordData[0].landlord_user_id;
      const propertyName = landlordData[0].property_name || "Property";
      const unitName = landlordData[0].unit_name || "Unit";
      const url = `/pages/landlord/property-listing/view-unit/tenant-req/${unit_id}`;

      // ✅ Notification details
      const title = "New Tenant Application";
      const body = `A tenant has submitted an application for ${propertyName} – ${unitName}.`;

      // Insert Notification in DB
      await db.query(
          `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, NOW())`,
          [landlordUserId, title, body, url]
      );

      // ✅ Send Web Push Notification
      const [subscriptions]: any = await db.query(
          `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
          [landlordUserId]
      );

      if (subscriptions.length > 0) {
        const payload = JSON.stringify({
          title,
          body,
          url: `${process.env.NEXT_PUBLIC_BASE_URL}${url}`,
          icon: `${process.env.NEXT_PUBLIC_BASE_URL}/icons/notification-icon.png`,
        });

        for (const sub of subscriptions) {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          };

          try {
            await webpush.sendNotification(pushSubscription, payload);
          } catch (err) {
            console.warn("❌ Web Push failed:", err.message);
          }
        }
      }
    }

    return NextResponse.json({ message: "Application submitted successfully!" }, { status: 201 });
  } catch (error: any) {
    console.error("[Submit Application] Error:", error);
    return NextResponse.json(
        { message: "Failed to submit application", error: error.message },
        { status: 500 }
    );
  }
}
