import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";

// === AWS S3 Setup ===
const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

// === Helper: Upload to S3 (returns URL) ===
async function uploadToS3(file: File, landlord_id: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = mime.extension(file.type) || "bin";
    const key = `tax_certificates/${landlord_id}/${Date.now()}.${ext}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        })
    );

    return `https://${process.env.NEXT_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}

// === GET: Retrieve tax profile ===
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id)
        return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });

    try {
        const [rows]: any = await db.query(
            "SELECT * FROM LandlordTaxProfile WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );

        return NextResponse.json({ profile: rows[0] || null });
    } catch (err: any) {
        console.error("❌ GET /taxProfile error:", err);
        return NextResponse.json({ error: "Database query failed" }, { status: 500 });
    }
}

// === POST: Create or Update Tax Profile (Idempotent + Atomic) ===
export async function POST(req: NextRequest) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const formData = await req.formData();

        const landlord_id = formData.get("landlord_id") as string;
        const tin_number = formData.get("tin_number") as string;
        const registered_name = formData.get("registered_name") as string;
        const bir_branch_code = formData.get("bir_branch_code") as string;
        const tax_type = formData.get("tax_type") as string;
        const filing_type = formData.get("filing_type") as string;
        const birFile = formData.get("bir_certificate") as File | null;

        if (!landlord_id || !tin_number) {
            await connection.rollback();
            connection.release();
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Optional S3 Upload (done before DB commit to ensure data consistency)
        let bir_certificate_url: string | null = null;
        if (birFile && birFile.size > 0) {
            bir_certificate_url = await uploadToS3(birFile, landlord_id);
        }

        // Check for existing profile (Idempotence)
        const [existingRows]: any = await connection.query(
            "SELECT tax_profile_id FROM LandlordTaxProfile WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );

        if (existingRows.length > 0) {
            // === Update existing record ===
            const updateSql = `
        UPDATE LandlordTaxProfile
        SET
          tin_number = ?,
          registered_name = ?,
          bir_branch_code = ?,
          tax_type = ?,
          filing_type = ?,
          ${bir_certificate_url ? "bir_certificate_url = ?," : ""}
          updated_at = NOW()
        WHERE landlord_id = ?
      `;

            const params = bir_certificate_url
                ? [
                    tin_number,
                    registered_name,
                    bir_branch_code,
                    tax_type,
                    filing_type,
                    bir_certificate_url,
                    landlord_id,
                ]
                : [
                    tin_number,
                    registered_name,
                    bir_branch_code,
                    tax_type,
                    filing_type,
                    landlord_id,
                ];

            await connection.query(updateSql, params);
        } else {
            // === Insert new record (Idempotent-safe) ===
            const insertSql = `
        INSERT INTO LandlordTaxProfile (
          tax_profile_id, landlord_id, tin_number, registered_name,
          bir_branch_code, tax_type, filing_type, bir_certificate_url,
          created_at, updated_at
        )
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
            await connection.query(insertSql, [
                landlord_id,
                tin_number,
                registered_name,
                bir_branch_code,
                tax_type,
                filing_type,
                bir_certificate_url,
            ]);
        }

        // === Commit Transaction ===
        await connection.commit();
        connection.release();

        return NextResponse.json({ message: "Tax profile saved successfully" });
    } catch (error: any) {
        console.error("❌ POST /taxProfile error:", error);
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: "Failed to save tax profile" }, { status: 500 });
    }
}
