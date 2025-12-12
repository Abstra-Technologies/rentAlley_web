import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { NextResponse, NextRequest } from "next/server";
import mime from "mime-types";

// S3 client setup
const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

// Upload buffer
async function uploadBufferToS3(buffer: Buffer, fileName: string, contentType: string) {
    const key = `landlord-docs/${Date.now()}-${fileName}`;
    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );
    return `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}

// Upload base64
async function uploadBase64ToS3(base64String: string) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const key = `landlord-selfies/${Date.now()}-selfie.jpg`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: "image/jpeg",
            ContentEncoding: "base64",
        })
    );

    return `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // Core fields
        const landlord_id = formData.get("landlord_id") as string;
        const documentType = formData.get("documentType") as string;
        const selfie = formData.get("selfie") as string;
        const uploadedFile = formData.get("uploadedFile") as File;

        // Personal info
        const firstName = (formData.get("firstName") as string) || "";
        const lastName = (formData.get("lastName") as string) || "";
        const companyName = (formData.get("companyName") as string) || null;
        const phoneNumber = (formData.get("phoneNumber") as string) || "";
        const civil_status = (formData.get("civil_status") as string) || "";
        const birthDate = (formData.get("dateOfBirth") as string) || "";
        const occupation = (formData.get("occupation") as string) || "";
        const address = (formData.get("address") as string) || "";
        const citizenship = (formData.get("citizenship") as string) || "";

        // NEW: Payout fields
        const payoutMethod = (formData.get("payoutMethod") as string) || "";
        const accountName = (formData.get("accountName") as string) || "";
        const accountNumber = (formData.get("accountNumber") as string) || "";
        const bankName = payoutMethod === "bank_transfer"
            ? (formData.get("bankName") as string)
            : null;

        // Validate required fields
        if (!landlord_id || !documentType || !selfie || !uploadedFile) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!payoutMethod || !accountName || !accountNumber) {
            return NextResponse.json({ error: "Missing payout details" }, { status: 400 });
        }

        if (payoutMethod === "bank_transfer" && !bankName) {
            return NextResponse.json({ error: "Bank name required for bank transfer" }, { status: 400 });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        // Validate landlord
        const [landlordRows]: any = await connection.execute(
            "SELECT landlord_id, user_id FROM Landlord WHERE landlord_id = ?",
            [landlord_id]
        );

        if (landlordRows.length === 0) {
            connection.release();
            return NextResponse.json({ error: "Landlord not found" }, { status: 404 });
        }

        const user_id = landlordRows[0].user_id;

        // Upload document → S3
        const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
        const safeFileName = uploadedFile.name.replace(/\s+/g, "_").replace(/[^\w\-_.]/g, "");
        const contentType = uploadedFile.type || mime.lookup(safeFileName) || "application/octet-stream";

        const documentUrl = await uploadBufferToS3(fileBuffer, safeFileName, contentType);

        // Upload selfie → S3
        const selfieUrl = await uploadBase64ToS3(selfie);

        // Encrypt S3 URLs
        const encryptedDoc = JSON.stringify(encryptData(documentUrl, process.env.ENCRYPTION_SECRET!));
        const encryptedSelfie = JSON.stringify(encryptData(selfieUrl, process.env.ENCRYPTION_SECRET!));

        // Insert verification record
        await connection.execute(
            `INSERT INTO LandlordVerification
             (landlord_id, document_type, document_url, selfie_url, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
            [landlord_id, documentType, encryptedDoc, encryptedSelfie]
        );

        // Encrypt sensitive fields
        const encryptedFirstName = JSON.stringify(encryptData(firstName, process.env.ENCRYPTION_SECRET!));
        const encryptedLastName = JSON.stringify(encryptData(lastName, process.env.ENCRYPTION_SECRET!));
        const encryptedCompanyName = companyName
            ? JSON.stringify(encryptData(companyName, process.env.ENCRYPTION_SECRET!))
            : null;
        const encryptedPhone = JSON.stringify(encryptData(phoneNumber, process.env.ENCRYPTION_SECRET!));
        const encryptedBirth = JSON.stringify(encryptData(birthDate, process.env.ENCRYPTION_SECRET!));
        const encryptedAddress = JSON.stringify(encryptData(address, process.env.ENCRYPTION_SECRET!));

        // Update User
        await connection.execute(
            `UPDATE User
             SET firstName = ?, lastName = ?, companyName = ?, phoneNumber = ?,
                 civil_status = ?, birthDate = ?, occupation = ?, address = ?, citizenship = ?, updatedAt = NOW()
             WHERE user_id = ?`,
            [
                encryptedFirstName,
                encryptedLastName,
                encryptedCompanyName,
                encryptedPhone,
                civil_status,
                encryptedBirth,
                occupation,
                encryptedAddress,
                citizenship,
                user_id,
            ]
        );

        // NEW: UPSERT Payout Information
        await connection.execute(
            `INSERT INTO LandlordPayoutAccount
                (landlord_id, payout_method, account_name, account_number, bank_name)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                payout_method = VALUES(payout_method),
                account_name = VALUES(account_name),
                account_number = VALUES(account_number),
                bank_name = VALUES(bank_name),
                updated_at = NOW()`,
            [landlord_id, payoutMethod, accountName, accountNumber, bankName]
        );

        await connection.commit();
        connection.release();

        return NextResponse.json({
            message: "Verification + payout info submitted successfully",
            documentUrl,
            selfieUrl,
        });

    } catch (error: any) {
        console.error("[VerificationUploadAPI] Error:", error);
        return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
    }
}
