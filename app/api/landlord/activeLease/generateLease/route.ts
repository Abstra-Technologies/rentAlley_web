import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import puppeteer from "puppeteer";
import { encryptData } from "@/crypto/encrypt";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔹 AWS SDK v3 client
const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();

        const {
            agreement_id,
            property_id,
            lease_type,
            start_date,
            end_date,
            rent_amount,
            billing_due_day,
            grace_period_days,
            late_fee_amount,
            rent_changed,
            security_deposit,
            advance_payment,
            allowed_occupants,
            notice_period,
            maintenance_responsibility,
            pet_policy,
            smoking_policy,
            utilities,
            furnishing_policy,
            termination_clause,
            entry_notice,
            landlord_id,
            tenant_id,
            property_name,
            unit_name,
            attestation,
        } = body;

        console.log('start date', start_date);
        console.log('end date', end_date);

        if (!agreement_id || !property_id) {
            return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
        }

        await connection.beginTransaction();

        // 🧾 Update Lease record with current values
        await connection.query(
            `
      UPDATE LeaseAgreement
      SET 
        start_date = ?,
        end_date = ?,
        rent_amount = ?,
        security_deposit_amount = ?,
        advance_payment_amount = ?,
        billing_due_day = ?,
        grace_period_days = ?,
        late_penalty_amount = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE agreement_id = ?
      `,
            [
                start_date,
                end_date,
                rent_amount,
                security_deposit || 0,
                advance_payment || 0,
                billing_due_day,
                grace_period_days,
                late_fee_amount,
                agreement_id,
            ]
        );

        // 🔍 Fetch full landlord & tenant info
        const [rows]: any = await connection.query(
            `
      SELECT 
        u1.firstName AS landlord_firstName,
        u1.lastName AS landlord_lastName,
        u1.address AS landlord_address,
        u1.email AS landlord_email,
        u1.citizenship AS landlord_citizenship,
        u1.occupation AS landlord_occupation,
        u1.civil_status AS landlord_civil_status,
        u2.firstName AS tenant_firstName,
        u2.lastName AS tenant_lastName,
        u2.address AS tenant_address,
        u2.email AS tenant_email,
        u2.citizenship AS tenant_citizenship,
        u2.occupation AS tenant_occupation,
        u2.civil_status AS tenant_civil_status
      FROM Landlord l
      JOIN User u1 ON l.user_id = u1.user_id
      JOIN Tenant t ON t.tenant_id = ?
      JOIN User u2 ON t.user_id = u2.user_id
      WHERE l.landlord_id = ?
      LIMIT 1
      `,
            [tenant_id, landlord_id]
        );

        if (!rows?.length) throw new Error("Landlord or Tenant not found.");
        const info = rows[0];

        // 🧩 HTML template
        const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        const leaseHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 20px; }
            p { line-height: 1.6; font-size: 14px; margin-bottom: 10px; }
            ul { font-size: 14px; }
            .signature-block { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature { width: 45%; text-align: center; }
            .signature-line { border-top: 1px solid #000; margin-top: 50px; }
          </style>
        </head>
        <body>
          <h1>${lease_type === "commercial" ? "COMMERCIAL LEASE AGREEMENT" : "RESIDENTIAL LEASE AGREEMENT"}</h1>

          <p><strong>1. PARTIES.</strong> This ${lease_type} Lease Agreement made on ${today} is between:</p>
          <p>
            <strong>Landlord:</strong> ${info.landlord_firstName} ${info.landlord_lastName}<br/>
            Address: ${info.landlord_address || "N/A"}<br/>
            Citizenship: ${info.landlord_citizenship || "N/A"}<br/>
            Occupation: ${info.landlord_occupation || "N/A"}<br/>
            Civil Status: ${info.landlord_civil_status || "N/A"}<br/>
            Email: ${info.landlord_email || "N/A"}
          </p>
          <p><strong>AND</strong></p>
          <p>
            <strong>Tenant:</strong> ${info.tenant_firstName} ${info.tenant_lastName}<br/>
            Address: ${info.tenant_address || "Same as property"}<br/>
            Citizenship: ${info.tenant_citizenship || "N/A"}<br/>
            Occupation: ${info.tenant_occupation || "N/A"}<br/>
            Civil Status: ${info.tenant_civil_status || "N/A"}<br/>
            Email: ${info.tenant_email || "N/A"}
          </p>

          <p><strong>2. PROPERTY.</strong> ${property_name}, Unit: ${unit_name}</p>
          <p><strong>3. TERM.</strong> ${start_date} to ${end_date}</p>
          <p><strong>4. RENT.</strong> ₱${Number(rent_amount).toLocaleString()} due every ${billing_due_day}th of the month.</p>
          <p><strong>5. SECURITY DEPOSIT.</strong> ${
            security_deposit
                ? `₱${Number(security_deposit).toLocaleString()} refundable`
                : "Not required"
        }.</p>

          <p><strong>6. ADDITIONAL TERMS.</strong></p>
          <ul>
            <li>Grace Period: ${grace_period_days || "N/A"} days</li>
            <li>Late Fee: ₱${Number(late_fee_amount || 0).toLocaleString()}</li>
            <li>Allowed Occupants: ${allowed_occupants || "—"}</li>
            <li>Termination Clause: ${termination_clause || "—"}</li>
            <li>Entry & Notice Requirement: ${entry_notice || "—"}</li>
            <li>Utilities: ${utilities || "—"}</li>
            <li>Pet Policy: ${pet_policy || "—"}</li>
            <li>Smoking Policy: ${smoking_policy || "—"}</li>
            <li>Furnishing: ${furnishing_policy || "—"}</li>
            <li>Maintenance Responsibility: ${maintenance_responsibility || "—"}</li>
          </ul>

          <div class="signature-block">
            <div class="signature">
              <div class="signature-line"></div>
              <p>${info.landlord_firstName} ${info.landlord_lastName}<br/>Landlord Signature</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p>${info.tenant_firstName} ${info.tenant_lastName}<br/>Tenant Signature</p>
            </div>
          </div>
        </body>
      </html>
    `;

        // 🧾 Generate PDF buffer
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setContent(leaseHTML, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        // 🪣 Upload directly to S3 (no tmp file)
        const fileKey = `leases/${agreement_id}_${Date.now()}.pdf`;
        const bucketName = process.env.NEXT_S3_BUCKET_NAME!;
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
                Body: pdfBuffer,
                ContentType: "application/pdf",
            })
        );

        const unencryptedUrl = `https://${bucketName}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileKey}`;
        const encryptedUrl = encryptData(unencryptedUrl, process.env.ENCRYPTION_SECRET!);

        await connection.query(
            `UPDATE LeaseAgreement SET agreement_url = ? WHERE agreement_id = ?`,
            [JSON.stringify(encryptedUrl), agreement_id]
        );

        await connection.commit();

        return NextResponse.json({ success: true, unencrypted_url: unencryptedUrl });
    } catch (error: any) {
        await connection.rollback();
        console.error("❌ Lease generation error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
