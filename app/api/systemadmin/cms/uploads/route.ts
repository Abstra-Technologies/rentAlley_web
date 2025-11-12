import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

/**
 * POST /api/systemadmin/cms/uploads
 * Uploads an image (base64) to a specified Cloudinary folder.
 *
 * Body:
 * {
 *   "image": "data:image/png;base64,...",
 *   "folder": "upkyp/headers/landlord"
 * }
 */
export async function POST(req: Request) {
    try {
        const { image, folder } = await req.json();

        // Validation
        if (!image) {
            return NextResponse.json(
                { success: false, error: "Missing image data." },
                { status: 400 }
            );
        }
        if (!folder) {
            return NextResponse.json(
                { success: false, error: "Missing folder path." },
                { status: 400 }
            );
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder,
            resource_type: "image",
            transformation: [
                { width: 1920, height: 1080, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" },
            ],
        });

        return NextResponse.json({
            success: true,
            message: "Image uploaded successfully.",
            data: {
                public_id: result.public_id,
                secure_url: result.secure_url,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                created_at: result.created_at,
            },
        });
    } catch (error: any) {
        console.error("Cloudinary Upload Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Image upload failed.",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
