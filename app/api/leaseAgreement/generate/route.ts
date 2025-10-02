
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { encryptData } from "@/crypto/encrypt";
import { randomUUID } from "crypto";
import puppeteer from "puppeteer";

const encryptionSecret = process.env.ENCRYPTION_SECRET;

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
        const {
            unitId,
            startDate,
            endDate,
            depositAmount,
            advanceAmount,
            gracePeriod,
            latePenalty,
            billingDueDay,
            expenses,       // [{category, type, amount, frequency}]
            otherPenalties, // [{type, amount}]
            content,
        } = await req.json();

        console.log('body response penalyu', otherPenalties);

        if (!unitId || !startDate || !endDate || !content) {
            return NextResponse.json(
                { error: "unitId, startDate, endDate, and content are required" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // Step 1: Find tenant
        const [leaseRows] = await connection.execute(
            `SELECT agreement_id, tenant_id
             FROM LeaseAgreement
             WHERE unit_id = ? AND status = 'pending'
             LIMIT 1`,
            [unitId]
        );

        let tenant_id: number | null = null;
        let agreement_id: number | null = null;
        let isFromLeaseAgreement = false;

        if ((leaseRows as any[]).length > 0) {
            tenant_id = (leaseRows as any[])[0].tenant_id;
            agreement_id = (leaseRows as any[])[0].agreement_id;
            isFromLeaseAgreement = true;
        } else {
            const [ptRows] = await connection.execute(
                `SELECT tenant_id
                 FROM ProspectiveTenant
                 WHERE unit_id = ? AND status = 'approved'
                 LIMIT 1`,
                [unitId]
            );

            if ((ptRows as any[]).length === 0) {
                return NextResponse.json(
                    { error: "No approved tenant found for this unit" },
                    { status: 404 }
                );
            }
            tenant_id = (ptRows as any[])[0].tenant_id;
        }

        // Step 2: Prevent duplicate active lease
        const [existingLease] = await connection.execute(
            `SELECT agreement_id
             FROM LeaseAgreement
             WHERE tenant_id = ? AND unit_id = ? AND status != 'pending'`,
            [tenant_id, unitId]
        );

        if ((existingLease as any[]).length > 0) {
            return NextResponse.json(
                { error: "Active lease already exists for this tenant and unit." },
                { status: 409 }
            );
        }

        // Step 3: Generate PDF from HTML content
        const browser = await puppeteer.launch({
            // @ts-ignore
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.setContent(`
      <html>
        <head><meta charset="UTF-8" /></head>
        <body>${content}</body>
      </html>
    `);
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "1in",
                bottom: "1in",
                left: "0.75in",
                right: "0.75in",
            },
        });
        await browser.close();

        // Step 4: Upload to S3
        const sanitizedFilename = sanitizeFilename(`Lease_${unitId}.pdf`);
        const s3Key = `leaseAgreements/${Date.now()}_${randomUUID()}_${sanitizedFilename}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                Key: s3Key,
                Body: pdfBuffer,
                ContentType: "application/pdf",
            })
        );

        const s3Url = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${s3Key}`;
        const encryptedUrl = JSON.stringify(encryptData(s3Url, encryptionSecret!));

        // Step 5: Insert or Update LeaseAgreement
        if (isFromLeaseAgreement && agreement_id) {
            await connection.execute(
                `UPDATE LeaseAgreement
                 SET agreement_url = ?, start_date = ?, end_date = ?,
                     security_deposit_amount = ?, advance_payment_amount = ?,
                     grace_period_days = ?, late_penalty_amount = ?, billing_due_day = ?,
                     updated_at = NOW()
                 WHERE agreement_id = ?`,
                [
                    encryptedUrl,
                    startDate,
                    endDate,
                    Number(depositAmount) || 0,
                    Number(advanceAmount) || 0,
                    Number(gracePeriod) || 3,
                    Number(latePenalty) || 1000,
                    Number(billingDueDay) || 1,
                    agreement_id,
                ]
            );
        } else {
            const [insertResult]: any = await connection.execute(
                `INSERT INTO LeaseAgreement
     (tenant_id, unit_id, start_date, end_date, agreement_url,
      security_deposit_amount, advance_payment_amount,
      grace_period_days, late_penalty_amount, billing_due_day,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    tenant_id,
                    unitId,
                    startDate,
                    endDate,
                    encryptedUrl,
                    Number(depositAmount) || 0,
                    Number(advanceAmount) || 0,
                    Number(gracePeriod) || 3,
                    Number(latePenalty) || 1000,
                    Number(billingDueDay) || 1,
                ]
            );
            agreement_id = insertResult.insertId;

        }

        if (agreement_id) {
            await connection.execute(
                `INSERT INTO LeaseSignature (agreement_id, role, status)
         VALUES (?, 'landlord', 'pending'), (?, 'tenant', 'pending')`,
                [agreement_id, agreement_id]
            );
        }


// Step 7: Save excluded/maintenance expenses if provided
        if (expenses && Array.isArray(expenses)) {
            console.log("📦 Expenses received:", expenses);
            for (const row of expenses) {
                if (!row.type || !row.amount) {
                    console.log("⚠️ Skipping invalid expense row:", row);
                    continue;
                }

                console.log("➕ Inserting expense:", {
                    agreement_id,
                    category: row.category || "excluded_fee",
                    type: row.type,
                    amount: row.amount,
                    frequency: row.frequency || "monthly",
                });

                await connection.execute(
                    `INSERT INTO LeaseAdditionalExpense 
         (agreement_id, category, expense_type, amount, frequency, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        agreement_id,
                        row.category || "excluded_fee",
                        row.type,
                        Number(row.amount),
                        row.frequency || "monthly",
                    ]
                );
            }
        }


// Step 8: Save other penalties if provided
        if (otherPenalties && Array.isArray(otherPenalties)) {
            console.log("📦 Other penalties received:", otherPenalties);
            for (const row of otherPenalties) {
                if (!row.type || !row.amount) {
                    console.log("⚠️ Skipping invalid penalty row:", row);
                    continue;
                }

                console.log("➕ Inserting penalty:", {
                    agreement_id,
                    type: row.type,
                    amount: row.amount,
                });

                await connection.execute(
                    `INSERT INTO LeaseAdditionalExpense 
         (agreement_id, category, expense_type, amount, frequency, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        agreement_id,
                        "penalty",
                        row.type,
                        Number(row.amount),
                        "one_time",
                    ]
                );
            }
        }


        await connection.commit();
        connection.release();

        return NextResponse.json({
            message: "Lease agreement generated & uploaded successfully.",
            fileBase64: Buffer.from(pdfBuffer).toString("base64"),
            signedUrl: s3Url,
            fileKey: s3Key,
            agreementId: agreement_id,
        });

    } catch (error: any) {
        await connection.rollback();
        connection.release();
        console.error("Lease Upload Error:", error);
        return NextResponse.json(
            { error: "Internal server error", message: error.message },
            { status: 500 }
        );
    }
}
