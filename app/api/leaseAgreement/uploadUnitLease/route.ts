import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { encryptData } from "@/crypto/encrypt";

const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const formData = await req.formData();

        const unitId = formData.get("unitId") as string;
        const signatureOption = formData.get("signatureOption") as string;
        const leaseFile = formData.get("leaseFile") as File | null;

        if (!unitId || !leaseFile) {
            return NextResponse.json(
                { success: false, error: "unitId and leaseFile are required" },
                { status: 400 }
            );
        }

        // Convert file to buffer for S3 upload
        const buffer = Buffer.from(await leaseFile.arrayBuffer());
        const sanitizedFilename = sanitizeFilename(leaseFile.name || `Lease_${unitId}.pdf`);
        const s3Key = `leaseUploads/${Date.now()}_${randomUUID()}_${sanitizedFilename}`;

        // Upload to S3
        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                Key: s3Key,
                Body: buffer,
                ContentType: "application/pdf",
            })
        );

        const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${s3Key}`;
        const encryptedUrl = JSON.stringify(encryptData(s3Url, process.env.ENCRYPTION_SECRET!));

        // Parse JSON arrays from formData
        const excludedFees = JSON.parse((formData.get("excludedFees") as string) || "[]");
        const penalties = JSON.parse((formData.get("penalties") as string) || "[]");
        const included = JSON.parse((formData.get("included") as string) || "[]");
        const paymentMethods = JSON.parse((formData.get("paymentMethods") as string) || "[]");

        const leaseData = {
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            securityDeposit: Number(formData.get("securityDeposit") || 0),
            advancePayment: Number(formData.get("advancePayment") || 0),
            billingDueDay: Number(formData.get("billingDueDay") || 1),
            gracePeriod: Number(formData.get("gracePeriod") || 0),
            latePenaltyAmount: Number(formData.get("latePenaltyAmount") || 0),
            renewalTerms: formData.get("renewalTerms"),
            currency: formData.get("currency") || "PHP",
        };

        await connection.beginTransaction();

        // Step 1: Find tenant
        const [ptRows] = await connection.execute(
            `SELECT tenant_id
             FROM ProspectiveTenant
             WHERE unit_id = ? AND status = 'approved'
             LIMIT 1`,
            [unitId]
        );

        if ((ptRows as any[]).length === 0) {
            return NextResponse.json(
                { success: false, error: "No approved tenant found for this unit" },
                { status: 404 }
            );
        }
        const tenant_id = (ptRows as any[])[0].tenant_id;

        // Step 2: Insert LeaseAgreement with uploaded S3 file
        const [insertResult]: any = await connection.execute(
            `INSERT INTO LeaseAgreement
             (tenant_id, unit_id, start_date, end_date, agreement_url,
              security_deposit_amount, advance_payment_amount,
              grace_period_days, late_penalty_amount, billing_due_day,
              status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                tenant_id,
                unitId,
                leaseData.startDate,
                leaseData.endDate,
                encryptedUrl,
                leaseData.securityDeposit,
                leaseData.advancePayment,
                leaseData.gracePeriod,
                leaseData.latePenaltyAmount,
                leaseData.billingDueDay,
                signatureOption === "signed" ? "active" : "pending",
            ]
        );
        const agreement_id = insertResult.insertId;

        // Step 3: Save excluded fees
        for (const row of excludedFees) {
            if (!row.key || !row.amount) continue;
            await connection.execute(
                `INSERT INTO LeaseAdditionalExpense
                     (agreement_id, category, expense_type, amount, frequency, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [agreement_id, "excluded_fee", row.key, Number(row.amount), "monthly"]
            );
        }

        // Step 4: Save penalties
        for (const row of penalties) {
            if (!row.type || !row.amount) continue;
            await connection.execute(
                `INSERT INTO LeaseAdditionalExpense
                     (agreement_id, category, expense_type, amount, frequency, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [agreement_id, "penalty", row.type, Number(row.amount), "one_time"]
            );
        }

        // Step 6: If e-sign needed, insert pending signatures
        if (signatureOption === "docusign") {
            await connection.execute(
                `INSERT INTO LeaseSignature (agreement_id, role, status)
                 VALUES (?, 'landlord', 'pending'), (?, 'tenant', 'pending')`,
                [agreement_id, agreement_id]
            );
        }

        await connection.commit();
        connection.release();

        return NextResponse.json({
            success: true,
            message: "Lease uploaded successfully.",
            s3Url,
            agreementId: agreement_id,
        });
    } catch (error: any) {
        await connection.rollback();
        connection.release();
        console.error("Lease Upload Error:", error);
        return NextResponse.json(
            { success: false, error: `Database operation failed during lease upload: ${error.message}` },
            { status: 500 }
        );
    }
}