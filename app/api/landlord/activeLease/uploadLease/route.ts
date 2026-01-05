// API: System-generated lease (formal sentence-based contract)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import { uploadToS3 } from "@/lib/s3";
import { encryptData } from "@/crypto/encrypt";
import { randomUUID } from "crypto";
import { sendUserNotification } from "@/lib/notifications/sendUserNotification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();

        const {
            agreement_id,
            property_id,
            unit_id,
            landlord_id,
            tenant_id,

            property_name,
            unit_name,
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
            notice_period,
            maintenance_responsibility,
            pet_policy,
            smoking_policy,
            utilities,
            furnishing_policy,
            termination_clause,
            entry_notice,

            attestation,
        } = body;

        if (!agreement_id || !property_id || !tenant_id || !landlord_id) {
            return NextResponse.json(
                { error: "Missing required parameters." },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        /* --------------------------------------------------
         * 1️⃣ UPDATE LEASE AGREEMENT RECORD
         * -------------------------------------------------- */
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
                updated_at = NOW()
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

        /* --------------------------------------------------
         * 2️⃣ FETCH LANDLORD & TENANT DETAILS
         * -------------------------------------------------- */
        const [rows]: any = await connection.query(
            `
            SELECT
                u1.firstName AS landlord_firstName,
                u1.lastName AS landlord_lastName,
                u1.address AS landlord_address,
                u1.email AS landlord_email,

                u2.firstName AS tenant_firstName,
                u2.lastName AS tenant_lastName,
                u2.address AS tenant_address,
                u2.email AS tenant_email
            FROM Landlord l
            JOIN User u1 ON l.user_id = u1.user_id
            JOIN Tenant t ON t.tenant_id = ?
            JOIN User u2 ON t.user_id = u2.user_id
            WHERE l.landlord_id = ?
            LIMIT 1
            `,
            [tenant_id, landlord_id]
        );

        if (!rows.length) {
            throw new Error("Landlord or tenant not found.");
        }

        const info = rows[0];

        /* --------------------------------------------------
         * 3️⃣ BUILD FORMAL LEASE HTML (SENTENCE-BASED)
         * -------------------------------------------------- */
        const today = new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });

        const leaseHTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
@page { margin: 50px; }
body {
    font-family: "Times New Roman", serif;
    font-size: 12.5pt;
    line-height: 1.65;
    color: #222;
    text-align: justify;
}
h1 { text-align: center; text-transform: uppercase; }
h2 { margin-top: 28px; }
.signature-block {
    margin-top: 70px;
    display: flex;
    justify-content: space-between;
}
.signature {
    width: 45%;
    text-align: center;
}
.signature-line {
    border-top: 1px solid #000;
    margin-top: 55px;
}
footer {
    position: fixed;
    bottom: 20px;
    width: 100%;
    text-align: center;
    font-size: 10pt;
    color: #666;
}
</style>
</head>

<body>
<h1>${lease_type === "commercial" ? "Commercial Lease Agreement" : "Residential Lease Agreement"}</h1>
<p style="text-align:center;">Executed on ${today}</p>

<h2>1. Parties to the Agreement</h2>
<p>
This Lease Agreement is entered into by and between
<strong>${info.landlord_firstName} ${info.landlord_lastName}</strong>,
residing at ${info.landlord_address} (hereinafter referred to as the “Landlord”),
and <strong>${info.tenant_firstName} ${info.tenant_lastName}</strong>,
residing at ${info.tenant_address} (hereinafter referred to as the “Tenant”).
Both parties acknowledge that they possess the legal capacity to enter into this Agreement.
</p>

<h2>2. Property Description</h2>
<p>
The Landlord hereby leases to the Tenant the premises known as
<strong>${property_name}</strong>, specifically identified as Unit
<strong>${unit_name}</strong>. The Tenant acknowledges having inspected
the premises and accepts it in its present condition.
</p>

<h2>3. Term of Tenancy</h2>
<p>
The term of this lease shall commence on <strong>${start_date}</strong>
and shall terminate on <strong>${end_date}</strong>, unless earlier terminated
in accordance with the provisions of this Agreement.
</p>

<h2>4. Rent Amount and Payment Details</h2>
<p>
The Tenant agrees to pay the Landlord a monthly rental amount of
<strong>₱${Number(rent_amount).toLocaleString()}</strong>,
which shall be due on the <strong>${billing_due_day}</strong> day of each month.
The Tenant shall be entitled to a grace period of
<strong>${grace_period_days}</strong> day(s), after which a late fee of
<strong>₱${Number(late_fee_amount).toLocaleString()}</strong> shall be imposed.
</p>

<h2>5. Security Deposit</h2>
<p>
The Tenant shall pay a security deposit in the amount of
<strong>₱${Number(security_deposit || 0).toLocaleString()}</strong>,
which shall serve as security for the faithful performance of the Tenant’s obligations
under this Agreement.
</p>

<h2>6. Advance Payment</h2>
<p>
The Tenant shall pay an advance rental amount of
<strong>₱${Number(advance_payment || 0).toLocaleString()}</strong>,
which shall be applied to the applicable rental period.
</p>

<h2>7. Occupancy and Use of Premises</h2>
<p>
The premises shall be occupied by no more than
<strong>${allowed_occupants || "the number of occupants approved by the Landlord"}</strong>.
The Tenant agrees to use the premises exclusively for lawful
${lease_type === "commercial" ? "commercial" : "residential"} purposes.
</p>

<h2>8. Utilities and Other Charges</h2>
<p>
Responsibility for utility payments shall be governed by the following arrangement:
<strong>${utilities}</strong>. The Tenant agrees to promptly settle all utility charges
for which they are responsible.
</p>

<h2>9. Maintenance and Repairs</h2>
<p>
Maintenance responsibilities shall be allocated as follows:
<strong>${maintenance_responsibility}</strong>.
The Tenant agrees to keep the premises in a clean and habitable condition.
</p>

<h2>10. Rules, Regulations, and Conduct</h2>
<p>
The Tenant agrees to comply with all applicable laws and property rules.
Smoking within the premises shall be governed by the following policy:
<strong>${smoking_policy}</strong>.
</p>

<h2>11. Pet Clause</h2>
<p>
The keeping of pets within the premises shall be governed by the following policy:
<strong>${pet_policy}</strong>. The Tenant shall be liable for any damage caused by pets.
</p>

<h2>12. Entry and Inspection</h2>
<p>
The Landlord may enter the premises for lawful purposes upon providing notice
in accordance with the following requirement:
<strong>${entry_notice}</strong>, except in cases of emergency.
</p>

<h2>13. Termination Clause</h2>
<p>
This Agreement may be terminated in accordance with the following condition:
<strong>${termination_clause}</strong>.
</p>

<h2>14. Attestation</h2>
<p>
The Tenant affirms that all information provided in connection with this lease
is true and correct. Attestation status:
<strong>${attestation ? "Acknowledged" : "Not Acknowledged"}</strong>.
</p>

<h2>15. Execution</h2>
<p>
By signing below, both parties acknowledge that they have read, understood,
and agreed to all terms of this Lease Agreement.
</p>

<div class="signature-block">
  <div class="signature">
  (System Generated, please see the Certificate of Authenticity document).
    <div class="signature-line"></div>
    ${info.landlord_firstName} ${info.landlord_lastName}<br/>Landlord
  </div>
  <div class="signature">
    (System Generated, please see the Certificate of Authenticity document).
    <div class="signature-line"></div>
    ${info.tenant_firstName} ${info.tenant_lastName}<br/>Tenant
  </div>
</div>

<footer>Generated by Upkyp • Rental Property Management Platform • Agreement ID: ${agreement_id}</footer>
</body>
</html>
`;

        /* --------------------------------------------------
         * 4️⃣ GENERATE PDF
         * -------------------------------------------------- */
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setContent(leaseHTML, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        /* --------------------------------------------------
         * 5️⃣ UPLOAD TO S3 (LIB)
         * -------------------------------------------------- */
        const key = `leases/${agreement_id}_${randomUUID()}.pdf`;
        const s3Url = await uploadToS3(pdfBuffer, key, "application/pdf");

        const encryptedUrl = JSON.stringify(
            encryptData(s3Url, SECRET_KEY)
        );

        await connection.query(
            `UPDATE LeaseAgreement SET agreement_url = ?, status = 'pending_signature' WHERE agreement_id = ?`,
            [encryptedUrl, agreement_id]
        );

        /* --------------------------------------------------
         * 6️⃣ CREATE SIGNATURE RECORDS
         * -------------------------------------------------- */
        await connection.query(
            `
            INSERT INTO LeaseSignature (agreement_id, email, role, status)
            VALUES
                (?, ?, 'landlord', 'pending'),
                (?, ?, 'tenant', 'pending')
            ON DUPLICATE KEY UPDATE status = 'pending'
            `,
            [
                agreement_id,
                info.landlord_email,
                agreement_id,
                info.tenant_email,
            ]
        );

        await connection.commit();

        /* --------------------------------------------------
         * 7️⃣ NOTIFY TENANT
         * -------------------------------------------------- */
        await sendUserNotification({
            userId: tenant_id,
            title: "Lease Ready for Signing",
            body: "A lease agreement has been generated and is ready for your review and signature.",
            url: `/pages/tenant/lease/view/${agreement_id}`,
        });

        return NextResponse.json({
            success: true,
            agreement_id,
            pdf_url: s3Url,
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("❌ Generate Lease Error:", error);
        return NextResponse.json(
            { error: "Failed to generate lease." },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
