import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { generateProspectiveTenantId } from "@/utils/id_generator";

/* ───────────────────────────────
   AWS S3
─────────────────────────────── */
const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

/* ───────────────────────────────
   Web Push
─────────────────────────────── */
webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

/* ───────────────────────────────
   Helpers
─────────────────────────────── */
class AppError extends Error {
    status: number;
    code: string;
    details?: unknown;
    constructor(message: string, status = 400, code = "BAD_REQUEST", details?: unknown) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

function errorResponse(err: unknown) {
    if (err instanceof AppError) {
        return NextResponse.json(
            { error: { code: err.code, message: err.message, details: err.details ?? null } },
            { status: err.status }
        );
    }
    console.error("Unhandled error:", err);
    return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } },
        { status: 500 }
    );
}

function getString(fd: FormData, key: string): string | null {
    const val = fd.get(key);
    if (typeof val !== "string") return null;
    const trimmed = val.trim();
    return trimmed.length ? trimmed : null;
}

function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9.]/g, "_");
}

async function uploadToS3(file: File, folder: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        })
    );

    return `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}

/* ───────────────────────────────
   File Limits (SERVER-SIDE)
─────────────────────────────── */
const MB = 1024 * 1024;
const FILE_LIMITS = {
    VALID_ID: 5 * MB,
    INCOME_IMAGE: 10 * MB,
    INCOME_PDF: 20 * MB,
};

function validateFile(file: File, type: "id" | "income") {
    if (type === "id" && file.size > FILE_LIMITS.VALID_ID) {
        throw new AppError("Valid ID exceeds 5MB limit.", 413, "FILE_TOO_LARGE");
    }

    if (type === "income") {
        const isPdf = file.type === "application/pdf";
        const limit = isPdf ? FILE_LIMITS.INCOME_PDF : FILE_LIMITS.INCOME_IMAGE;

        if (file.size > limit) {
            throw new AppError(
                `Proof of income exceeds ${isPdf ? 20 : 10}MB limit.`,
                413,
                "FILE_TOO_LARGE"
            );
        }
    }
}

/* ───────────────────────────────
   POST Handler
─────────────────────────────── */
export async function POST(req: NextRequest) {
    let conn: any;

    try {
        const fd = await req.formData();

        /* ───── Extract & normalize ───── */
        const user_id = getString(fd, "user_id");
        const tenant_id = getString(fd, "tenant_id");
        const unit_id = getString(fd, "unit_id");

        const address = getString(fd, "address");
        const occupation = getString(fd, "occupation");
        const employment_type = getString(fd, "employment_type");
        const monthly_income = getString(fd, "monthly_income");
        const birthDate = getString(fd, "birthDate");
        const phoneNumber = getString(fd, "phoneNumber");

        const validIdFile = fd.get("valid_id") as File | null;
        const incomeFile = fd.get("income_proof") as File | null;

        /* ───── Validate required ───── */
        if (!user_id || !tenant_id || !unit_id) {
            throw new AppError("Authentication required.", 401, "AUTH_REQUIRED");
        }

        console.log('user tenasnyt id ', user_id, tenant_id);

        if (!address || !occupation || !employment_type || !monthly_income) {
            throw new AppError(
                "Please complete all required fields.",
                400,
                "INVALID_INPUT",
                { address, occupation, employment_type, monthly_income }
            );
        }

        if (!validIdFile) {
            throw new AppError("Valid ID is required.", 400, "MISSING_VALID_ID");
        }

        /* ───── Validate files ───── */
        validateFile(validIdFile, "id");
        if (incomeFile) validateFile(incomeFile, "income");

        /* ───── Encrypt sensitive fields ───── */
        const encryptedPhone = phoneNumber
            ? JSON.stringify(encryptData(phoneNumber, process.env.ENCRYPTION_SECRET!))
            : null;

        const encryptedBirthDate = birthDate
            ? JSON.stringify(encryptData(birthDate, process.env.ENCRYPTION_SECRET!))
            : null;

        /* ───── Upload files ───── */
        const validIdUrl = JSON.stringify(
            encryptData(await uploadToS3(validIdFile, "validIdTenant"), process.env.ENCRYPTION_SECRET!)
        );

        const incomeProofUrl = incomeFile
            ? JSON.stringify(
                encryptData(await uploadToS3(incomeFile, "incomeProofTenant"), process.env.ENCRYPTION_SECRET!)
            )
            : null;

        /* ───── Transaction ───── */
        conn = await db.getConnection();
        await conn.beginTransaction();

        await conn.execute(
            `
      UPDATE User
      SET address = ?, occupation = ?, 
          birthDate = COALESCE(?, birthDate),
          phoneNumber = COALESCE(?, phoneNumber),
          updatedAt = NOW()
      WHERE user_id = ?
      `,
            [address, occupation, encryptedBirthDate, encryptedPhone, user_id]
        );

        await conn.execute(
            `
      UPDATE Tenant
      SET employment_type = ?, monthly_income = ?, updatedAt = NOW()
      WHERE tenant_id = ?
      `,
            [employment_type, monthly_income, tenant_id]
        );

        const [existing]: any = await conn.execute(
            `SELECT id FROM ProspectiveTenant WHERE tenant_id = ? AND unit_id = ? LIMIT 1`,
            [tenant_id, unit_id]
        );

        if (existing.length > 0) {
            await conn.execute(
                `
        UPDATE ProspectiveTenant
        SET valid_id = ?, proof_of_income = COALESCE(?, proof_of_income),
            updated_at = NOW()
        WHERE tenant_id = ? AND unit_id = ?
        `,
                [validIdUrl, incomeProofUrl, tenant_id, unit_id]
            );
        } else {
            const id = generateProspectiveTenantId();
            await conn.execute(
                `
        INSERT INTO ProspectiveTenant
        (id, tenant_id, unit_id, valid_id, proof_of_income, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        `,
                [id, tenant_id, unit_id, validIdUrl, incomeProofUrl]
            );
        }

        await conn.commit();

        return NextResponse.json(
            { message: "Application submitted successfully." },
            { status: 201 }
        );
    } catch (err) {
        if (conn) {
            try {
                await conn.rollback();
            } finally {
                conn.release();
            }
        }
        return errorResponse(err);
    } finally {
        if (conn) conn.release();
    }
}
