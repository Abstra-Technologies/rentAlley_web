import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData, decryptData } from "@/crypto/encrypt";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AWS SDK v3 S3 client
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

        // Update basic lease info
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

        // Fetch encrypted landlord/tenant info
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

        // Decrypt all fields
        const decryptField = (field: string) => {
            try {
                return field ? decryptData(JSON.parse(field), process.env.ENCRYPTION_SECRET!) : "N/A";
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

        const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        const rentText = rent_amount ? `₱${Number(rent_amount).toLocaleString()}` : "N/A";
        const lateFeeText = `₱${Number(late_fee_amount || 0).toLocaleString()}`;
        const securityDepositText = security_deposit ? `₱${Number(security_deposit).toLocaleString()}` : "none";

        // Generate lease HTML (sentence form)
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

          <h2>1. Landlord details</h2>
          <p>
            ${info.landlord_firstName} ${info.landlord_lastName}<br/>
            Address: ${info.landlord_address}<br/>
            Citizenship: ${info.landlord_citizenship}<br/>
            Occupation: ${info.landlord_occupation}<br/>
            Civil status: ${info.landlord_civil_status}<br/>
            Email: ${info.landlord_email}
          </p>

          <h2>2. Tenant details</h2>
          <p>
            ${info.tenant_firstName} ${info.tenant_lastName}<br/>
            Address: ${info.tenant_address}<br/>
            Citizenship: ${info.tenant_citizenship}<br/>
            Occupation: ${info.tenant_occupation}<br/>
            Civil status: ${info.tenant_civil_status}<br/>
            Email: ${info.tenant_email}
          </p>

          <h2>3. Property</h2>
          <p>The leased property is located at ${property_name}, unit ${unit_name}.</p>

          <h2>4. Lease term</h2>
          <p>The lease starts on ${start_date} and ends on ${end_date}, unless earlier terminated under this agreement.</p>

          <h2>5. Rent</h2>
          <p>The tenant agrees to pay a monthly rent of ${rentText}, due every ${billing_due_day} of each month.</p>

          <h2>6. Security deposit</h2>
          <p>A security deposit of ${securityDepositText} shall be held by the landlord and refunded upon lease termination, subject to lawful deductions.</p>

          <h2>7. Additional terms</h2>
          <p><strong>Grace period.</strong> The tenant has ${grace_period_days || "not specified"} days after the due date to pay rent without penalty.</p>
          <p><strong>Late fee.</strong> A late fee of ${lateFeeText} shall apply for each month that rent remains unpaid after the grace period.</p>
          <p><strong>Allowed occupants.</strong> ${allowed_occupants || "The number of allowed occupants is not specified."}</p>
          <p><strong>Termination clause.</strong> ${termination_clause || "Either party may terminate this lease with proper written notice."}</p>
          <p><strong>Entry and notice requirement.</strong> ${entry_notice || "The landlord must provide at least 24 hours’ notice before entering the property."}</p>
          <p><strong>Utilities.</strong> ${utilities || "The tenant shall be responsible for utilities unless otherwise stated."}</p>
          <p><strong>Pet policy.</strong> ${pet_policy || "Pets are not allowed without landlord approval."}</p>
          <p><strong>Smoking policy.</strong> ${smoking_policy || "Smoking is prohibited within the premises."}</p>
          <p><strong>Furnishing.</strong> ${furnishing_policy || "The property is provided as described and must be returned in good condition."}</p>
          <p><strong>Maintenance responsibility.</strong> ${maintenance_responsibility || "The tenant handles minor repairs while the landlord maintains major systems."}</p>

          <p>Both parties have read, understood, and agreed to the terms of this lease agreement, affixing their signatures below.</p>

          <div class="signature-block">
            <div class="signature">
              <div class="signature-line"></div>
              <p>${info.landlord_firstName} ${info.landlord_lastName}<br/>Landlord signature</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p>${info.tenant_firstName} ${info.tenant_lastName}<br/>Tenant signature</p>
            </div>
          </div>
        </body>
      </html>
    `;

        // Generate PDF
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setContent(leaseHTML, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        // Upload PDF to S3
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

        // Encrypt URL before saving
        const encryptedUrl = JSON.stringify(encryptData(fileUrl, process.env.ENCRYPTION_SECRET!));

        await connection.query(
            "UPDATE LeaseAgreement SET agreement_url = ? WHERE agreement_id = ?",
            [encryptedUrl, agreement_id]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Lease generated successfully",
            s3_url: fileUrl,
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("❌ Lease generation error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
