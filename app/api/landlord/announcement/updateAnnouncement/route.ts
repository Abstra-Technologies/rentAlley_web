import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { parse } from "cookie";
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { encryptData, decryptData } from "@/crypto/encrypt";
import sanitizeHtml from "sanitize-html"; // <-- added

const s3Client = new S3Client({
    region: process.env.NEXT_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_").replace(/\s+/g, "_");
}

function detectDevice(ua: string) {
    const agent = ua.toLowerCase();
    if (agent.includes("mobile")) return "mobile";
    if (agent.includes("tablet") || agent.includes("ipad")) return "tablet";
    return "web";
}

export async function PUT(req: NextRequest) {
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const deviceType = detectDevice(userAgent);
    const endpoint = req.url;
    const httpMethod = req.method;
    const statusCode = 200;

    try {
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies || !cookies.token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(cookies.token, secretKey);
        const loggedUser = payload.user_id;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Announcement ID is required" },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const subject = (formData.get("subject") as string)?.trim();
        let description = (formData.get("description") as string)?.trim(); // <-- sanitize below
        const property_id = formData.get("property_id") as string;
        const deleteImageIds = formData.getAll("deleteImageIds[]").map(String);

        if (!subject || !description || !property_id) {
            return NextResponse.json(
                {
                    message:
                        "Missing required fields: subject, description, and property_id are required",
                },
                { status: 400 }
            );
        }

        // Sanitize HTML content
        description = sanitizeHtml(description, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                "h1",
                "h2",
                "h3",
                "p",
                "span",
                "ul",
                "ol",
                "li",
                "br",
                "strong",
                "em",
                "u",
                "a",
                "img",
            ]),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                a: ["href", "name", "target", "rel"],
                img: ["src", "alt", "width", "height", "style"],
                span: ["style"],
            },
            allowedSchemesByTag: {
                a: ["http", "https", "mailto"],
                img: ["http", "https", "data"],
            },
            allowedStyles: {
                "*": {
                    color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
                    "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
                    "font-weight": [/^bold$/, /^\d+$/],
                    "text-decoration": [/^underline$/, /^line-through$/],
                },
            },
        });

        // Check if announcement exists
        const checkQuery =
            "SELECT announcement_id, landlord_id FROM Announcement WHERE announcement_id = ?";
        const [existingRows] = await db.execute(checkQuery, [id]);

        if ((existingRows as any[]).length === 0) {
            return NextResponse.json(
                { message: "Announcement not found" },
                { status: 404 }
            );
        }

        const announcement = (existingRows as any[])[0];

        // Verify ownership
        const [landlordRows] = await db.execute(
            "SELECT user_id FROM Landlord WHERE landlord_id = ?",
            [announcement.landlord_id]
        );
        const landlord = (landlordRows as any[])[0];

        // Delete images if requested
        if (deleteImageIds.length > 0) {
            const [imageRows]: any = await db.execute(
                `SELECT photo_id, photo_url FROM AnnouncementPhoto WHERE photo_id IN (${deleteImageIds
                    .map(() => "?")
                    .join(",")})`,
                deleteImageIds
            );

            for (const image of imageRows) {
                try {
                    const decryptedUrl = decryptData(
                        JSON.parse(image.photo_url),
                        encryptionSecret
                    );
                    const key = decryptedUrl.split(".amazonaws.com/")[1];

                    await s3Client.send(
                        new DeleteObjectCommand({
                            Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                            Key: key,
                        })
                    );
                } catch (error) {
                    console.error("Error deleting image from S3:", error);
                }
            }

            await db.execute(
                `DELETE FROM AnnouncementPhoto WHERE photo_id IN (${deleteImageIds
                    .map(() => "?")
                    .join(",")})`,
                deleteImageIds
            );
        }

        // Check current image count
        const [countRows]: any = await db.execute(
            "SELECT COUNT(*) as count FROM AnnouncementPhoto WHERE announcement_id = ?",
            [id]
        );
        const currentImageCount = countRows[0].count;

        // Upload new images (with 5 image limit)
        const files: File[] = [];
        for (const [, value] of formData.entries()) {
            if (value instanceof File && value.size > 0) files.push(value);
        }

        const remainingSlots = 5 - currentImageCount;
        const filesToUpload = files.slice(0, Math.max(0, remainingSlots));

        if (filesToUpload.length > 0) {
            const insertPhotoQuery = `
        INSERT INTO AnnouncementPhoto (announcement_id, photo_url, created_at)
        VALUES (?, ?, NOW());
      `;

            for (const file of filesToUpload) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const sanitizedFilename = sanitizeFilename(file.name);
                const fileName = `announcementPhoto/${Date.now()}_${sanitizedFilename}`;
                const photoUrl = `https://${process.env.NEXT_S3_BUCKET_NAME}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${fileName}`;
                const encryptedUrl = JSON.stringify(
                    encryptData(photoUrl, encryptionSecret)
                );

                await s3Client.send(
                    new PutObjectCommand({
                        Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                        Key: fileName,
                        Body: buffer,
                        ContentType: file.type,
                    })
                );

                await db.execute(insertPhotoQuery, [id, encryptedUrl]);
            }
        }

        // Update announcement
        const updateQuery = `
      UPDATE Announcement 
      SET subject = ?,
          description = ?,
          property_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE announcement_id = ?
    `;

        await db.execute(updateQuery, [subject, description, property_id, id]);

        // Log activity
        await db.execute(
            `INSERT INTO ActivityLog (
        user_id, action, description, target_table, target_id, old_value, new_value,
        endpoint, http_method, status_code, ip_address, user_agent, device_type, is_suspicious, timestamp
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
            [
                loggedUser,
                "Updated Announcement",
                `Updated announcement "${subject}" (ID: ${id}). ${
                    filesToUpload.length > 0
                        ? `Added ${filesToUpload.length} image(s). `
                        : ""
                }${
                    deleteImageIds.length > 0
                        ? `Deleted ${deleteImageIds.length} image(s).`
                        : ""
                }`,
                "Announcement",
                id,
                null,
                JSON.stringify({ subject, description, property_id }),
                endpoint,
                httpMethod,
                statusCode,
                ip,
                userAgent,
                deviceType,
            ]
        );

        return NextResponse.json({
            message: "Announcement updated successfully",
            id,
            imagesAdded: filesToUpload.length,
            imagesDeleted: deleteImageIds.length,
        });
    } catch (error: any) {
        console.error("Error updating announcement:", error.message, error.stack);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
