import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { NextResponse, NextRequest } from "next/server";
import mime from "mime-types";
import { parse } from "cookie";
import { jwtVerify } from "jose";

/* ------------------------------------------------------------
   CONFIG
------------------------------------------------------------ */
const DEBUG = process.env.NODE_ENV !== "production";

function debug(label: string, data?: any) {
    if (!DEBUG) return;
    console.log(`🧪 [VerificationUploadAPI] ${label}`);
    if (data !== undefined) {
        console.dir(data, { depth: 3 });
    }
}

const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

/* ------------------------------------------------------------
   HELPERS
------------------------------------------------------------ */
async function uploadBufferToS3(
    buffer: Buffer,
    key: string,
    contentType: string
) {
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

function base64ToBuffer(base64: string) {
    const cleaned = base64.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(cleaned, "base64");
}

/* ------------------------------------------------------------
   POST
------------------------------------------------------------ */
export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        /* ------------------------------------------------------------
           AUTH (same pattern as Admin API)
        ------------------------------------------------------------ */
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies?.token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secretKey);

        const user_id = payload.user_id;

        if (!user_id) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        /* ------------------------------------------------------------
           RESOLVE LANDLORD
        ------------------------------------------------------------ */
        const [landlordRows]: any = await connection.execute(
            `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
            [user_id]
        );

        if (!landlordRows.length) {
            return NextResponse.json(
                { error: "User is not a landlord" },
                { status: 403 }
            );
        }

        const landlord_id = landlordRows[0].landlord_id;

        /* ------------------------------------------------------------
           FORM DATA
        ------------------------------------------------------------ */
        const formData = await req.formData();

        const documentType = formData.get("documentType") as string;
        const selfie = formData.get("selfie") as string;

        const uploadedFile = formData.get("uploadedFile") as File | null;
        const capturedDocument = formData.get("capturedDocument") as string | null;

        if (!documentType || !selfie) {
            return NextResponse.json(
                { error: "Missing required verification fields" },
                { status: 400 }
            );
        }

        if (!uploadedFile && !capturedDocument) {
            return NextResponse.json(
                { error: "Document upload or capture is required" },
                { status: 400 }
            );
        }

        /* ------------------------------------------------------------
           BEGIN TRANSACTION
        ------------------------------------------------------------ */
        await connection.beginTransaction();

        /* ------------------------------------------------------------
           PREVENT DUPLICATE VERIFICATION
        ------------------------------------------------------------ */
        const [existing]: any = await connection.execute(
            `SELECT id FROM LandlordVerification
             WHERE landlord_id = ? AND status IN ('pending','approved')`,
            [landlord_id]
        );

        if (existing.length) {
            await connection.rollback();
            return NextResponse.json(
                {
                    code: "VERIFICATION_EXISTS",
                    message: "Verification already uploaded and under review",
                },
                { status: 409 }
            );
        }


        /* ------------------------------------------------------------
           UPLOAD DOCUMENT
        ------------------------------------------------------------ */
        let documentUrl: string;

        if (uploadedFile) {
            const buffer = Buffer.from(await uploadedFile.arrayBuffer());
            const safeName = uploadedFile.name.replace(/[^\w.-]/g, "_");

            documentUrl = await uploadBufferToS3(
                buffer,
                `landlord-docs/${Date.now()}-${safeName}`,
                uploadedFile.type || "application/octet-stream"
            );
        } else {
            const buffer = base64ToBuffer(capturedDocument!);
            documentUrl = await uploadBufferToS3(
                buffer,
                `landlord-docs/${Date.now()}-captured.jpg`,
                "image/jpeg"
            );
        }

        /* ------------------------------------------------------------
           UPLOAD SELFIE
        ------------------------------------------------------------ */
        const selfieBuffer = base64ToBuffer(selfie);
        const selfieUrl = await uploadBufferToS3(
            selfieBuffer,
            `landlord-selfies/${Date.now()}-selfie.jpg`,
            "image/jpeg"
        );

        /* ------------------------------------------------------------
           ENCRYPT & INSERT
        ------------------------------------------------------------ */
        await connection.execute(
            `INSERT INTO LandlordVerification
             (landlord_id, document_type, document_url, selfie_url, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [
                landlord_id,
                documentType,
                JSON.stringify(encryptData(documentUrl, process.env.ENCRYPTION_SECRET!)),
                JSON.stringify(encryptData(selfieUrl, process.env.ENCRYPTION_SECRET!)),
            ]
        );

        await connection.commit();

        return NextResponse.json({
            message: "Verification submitted successfully",
        });
    } catch (err: any) {
        await connection.rollback();

        console.error("❌ VerificationUploadAPI error:", err);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
