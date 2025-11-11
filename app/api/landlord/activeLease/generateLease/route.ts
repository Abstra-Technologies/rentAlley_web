import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData, decryptData } from "@/crypto/encrypt";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AWS S3 client
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
            security_deposit,
            advance_payment,
            allowed_occupants,
            termination_clause,
            entry_notice,
            maintenance_responsibility,
            pet_policy,
            smoking_policy,
            utilities,
            furnishing_policy,
            landlord_id,
            tenant_id,
            property_name,
            unit_name,
        } = body;

        if (!agreement_id || !property_id) {
            return NextResponse.json(
                { error: "Missing required parameters." },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // 🧾 1. Update lease agreement details
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

        // 🧩 2. Fetch encrypted landlord and tenant info
        const [rows] = await connection.query(
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

        if (!rows.length) throw new Error("Landlord or tenant not found.");

        const decryptField = (field: string) => {
            try {
                return field
                    ? decryptData(JSON.parse(field), process.env.ENCRYPTION_SECRET!)
                    : "N/A";
            } catch {
                return field || "N/A";
            }
        };

        const data = rows[0];
        const info = {
            landlord_firstName: decryptField(data.landlord_firstName),
            landlord_lastName: decryptField(data.landlord_lastName),
            landlord_address: decryptField(data.landlord_address),
            landlord_email: decryptField(data.landlord_email),
            landlord_citizenship: decryptField(data.landlord_citizenship),
            landlord_occupation: decryptField(data.landlord_occupation),
            landlord_civil_status: decryptField(data.landlord_civil_status),
            tenant_firstName: decryptField(data.tenant_firstName),
            tenant_lastName: decryptField(data.tenant_lastName),
            tenant_address: decryptField(data.tenant_address),
            tenant_email: decryptField(data.tenant_email),
            tenant_citizenship: decryptField(data.tenant_citizenship),
            tenant_occupation: decryptField(data.tenant_occupation),
            tenant_civil_status: decryptField(data.tenant_civil_status),
        };

        // 🧾 3. Generate lease HTML (clean, sentence-style)
        const today = new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });

        const rentText = rent_amount
            ? `₱${Number(rent_amount).toLocaleString()}`
            : "N/A";
        const lateFeeText = `₱${Number(late_fee_amount || 0).toLocaleString()}`;
        const securityDepositText = security_deposit
            ? `₱${Number(security_deposit).toLocaleString()}`
            : "none";

        const leaseHTML = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Georgia, serif; margin: 40px; color: #222; line-height: 1.6; font-size: 14px; }
            h1 { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
            h2 { font-size: 15px; margin-top: 22px; font-weight: bold; }
            p { margin-bottom: 10px; }
            .signature-block { margin-top: 40px; display: flex; justify-content: space-between; gap: 30px; }
            .signature { width: 45%; text-align: center; }
            .signature-line { border-top: 1px solid #000; margin-top: 40px; }
          </style>
        </head>
        <body>
          <h1>${lease_type === "commercial" ? "Commercial lease agreement" : "Residential lease agreement"}</h1>
          <p>This lease agreement is executed on ${today} between the landlord and the tenant under the following terms and conditions.</p>

          <h2>Landlord details</h2>
          <p>${info.landlord_firstName} ${info.landlord_lastName}<br/>
          Address: ${info.landlord_address}<br/>Email: ${info.landlord_email}</p>

          <h2>Tenant details</h2>
          <p>${info.tenant_firstName} ${info.tenant_lastName}<br/>
          Address: ${info.tenant_address}<br/>Email: ${info.tenant_email}</p>

          <h2>Property</h2>
          <p>The leased property is located at ${property_name}, unit ${unit_name}.</p>

          <h2>Lease term</h2>
          <p>The lease starts on ${start_date} and ends on ${end_date}.</p>

          <h2>Rent</h2>
          <p>The tenant agrees to pay a monthly rent of ${rentText}, due every ${billing_due_day} of each month.</p>

          <h2>Security deposit</h2>
          <p>A security deposit of ${securityDepositText} shall be held by the landlord and refunded upon lease termination, subject to lawful deductions.</p>

          <h2>Additional terms</h2>
          <p><strong>Grace period:</strong> ${grace_period_days || "Not specified"} days.</p>
          <p><strong>Late fee:</strong> ${lateFeeText} applies if rent is late.</p>

          <p>Both parties have read, understood, and agreed to the terms of this lease agreement.</p>

          <div class="signature-block">
            <div class="signature"><div class="signature-line"></div><p>${info.landlord_firstName} ${info.landlord_lastName}<br/>Landlord signature</p></div>
            <div class="signature"><div class="signature-line"></div><p>${info.tenant_firstName} ${info.tenant_lastName}<br/>Tenant signature</p></div>
          </div>
        </body>
      </html>
    `;

        // 🖨️ 4. Generate PDF and upload to S3
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setContent(leaseHTML, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        const fileKey = `leases/${agreement_id}_${uuidv4()}.pdf`;
        const bucketName = process.env.NEXT_S3_BUCKET_NAME!;
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
                Body: pdfBuffer,
                ContentType: "application/pdf",
            })
        );

        const fileUrl = `https://${bucketName}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileKey}`;
        const encryptedUrl = JSON.stringify(encryptData(fileUrl, process.env.ENCRYPTION_SECRET!));

        // 🧾 5. Update lease record
        await connection.query(
            `UPDATE LeaseAgreement SET agreement_url = ?, status = 'pending_signature' WHERE agreement_id = ?`,
            [encryptedUrl, agreement_id]
        );

        // 🧩 6. Create LeaseSignature entries for both parties
        await connection.query(
            `
      INSERT INTO LeaseSignature (agreement_id, email, role, status)
      VALUES
        (?, ?, 'landlord', 'pending'),
        (?, ?, 'tenant', 'pending')
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        status = 'pending';
      `,
            [agreement_id, info.landlord_email, agreement_id, info.tenant_email]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Lease generated successfully and marked pending signature.",
            s3_url: fileUrl,
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("❌ Lease generation error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
