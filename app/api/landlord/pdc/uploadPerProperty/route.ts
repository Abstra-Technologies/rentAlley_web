import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import mime from "mime";

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @route POST /api/landlord/pdc/upload
 * @desc Upload one or multiple PDCs (Post-Dated Checks) per property or lease.
 * @body FormData
 *   - property_id (required)
 *   - lease_id (optional)
 *   - pdcs[][check_number]
 *   - pdcs[][bank_name]
 *   - pdcs[][amount]
 *   - pdcs[][due_date]
 *   - pdcs[][notes]
 *   - pdcs[][uploaded_image]
 * @returns { success: true, insertedCount, pdcs: [...] }
 * @usedAt components/landlord/pdc/UploadPDCModal.tsx
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const propertyId = formData.get("property_id");
        const leaseId = formData.get("lease_id");

        if (!propertyId) {
            return NextResponse.json(
                { error: "Missing property_id" },
                { status: 400 }
            );
        }

        // 🧩 Extract all PDC entries
        const pdcs: any[] = [];
        for (const [key, value] of formData.entries()) {
            const match = key.match(/^pdcs\[(\d+)\]\[(.+)\]$/);
            if (match) {
                const index = parseInt(match[1]);
                const field = match[2];
                pdcs[index] = pdcs[index] || {};
                pdcs[index][field] = value;
            }
        }

        if (!pdcs.length) {
            return NextResponse.json(
                { error: "No PDCs provided in the request" },
                { status: 400 }
            );
        }

        // ✅ Upload all images to S3
        const uploadedPDCs = [];
        for (const pdc of pdcs) {
            const file = pdc.uploaded_image as unknown as File;
            let uploadedUrl = null;

            if (file && typeof file === "object" && "arrayBuffer" in file) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const ext = path.extname(file.name) || ".jpg";
                const key = `uploads/pdc/${randomUUID()}${ext}`;
                const contentType = mime.getType(ext) || "image/jpeg";

                await s3Client.send(
                    new PutObjectCommand({
                        Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                        Key: key,
                        Body: buffer,
                        ContentType: contentType,
                    })
                );

                uploadedUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
            }

            uploadedPDCs.push({
                lease_id: leaseId || null,
                check_number: pdc.check_number,
                bank_name: pdc.bank_name,
                amount: parseFloat(pdc.amount || "0"),
                due_date: pdc.due_date,
                status: "pending",
                uploaded_image_url: uploadedUrl,
                notes: pdc.notes || "",
            });
        }

        // ✅ Insert into DB using transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const pdc of uploadedPDCs) {
                if (!pdc.lease_id) {
                    // Auto-link PDC to lease via property if not directly provided
                    const [leaseRows]: any = await connection.query(
                        `
            SELECT l.agreement_id
            FROM LeaseAgreement AS l
            INNER JOIN Unit AS u ON l.unit_id = u.unit_id
            WHERE u.property_id = ? AND l.status IN ('active','completed')
            LIMIT 1
          `,
                        [propertyId]
                    );
                    pdc.lease_id = leaseRows[0]?.agreement_id || null;
                }

                if (!pdc.lease_id) continue; // skip orphaned

                await connection.query(
                    `
          INSERT INTO PostDatedCheck 
          (lease_id, check_number, bank_name, amount, due_date, status, uploaded_image_url, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
                    [
                        pdc.lease_id,
                        pdc.check_number,
                        pdc.bank_name,
                        pdc.amount,
                        pdc.due_date,
                        pdc.status,
                        pdc.uploaded_image_url,
                        pdc.notes,
                    ]
                );
            }

            await connection.commit();
            connection.release();

            return NextResponse.json({
                success: true,
                insertedCount: uploadedPDCs.length,
                pdcs: uploadedPDCs,
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            console.error("❌ Transaction failed:", err);
            return NextResponse.json(
                { error: "Failed to insert PDCs", details: err.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("❌ Upload PDC API error:", error);
        return NextResponse.json(
            { error: "Server error", details: error.message },
            { status: 500 }
        );
    }
}
