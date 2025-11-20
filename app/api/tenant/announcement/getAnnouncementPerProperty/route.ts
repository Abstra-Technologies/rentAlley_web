import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { decryptData } from "@/crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agreement_id = searchParams.get("agreement_id");

  if (!agreement_id) {
    return NextResponse.json(
      { error: "Agreement ID is required" },
      { status: 400 }
    );
  }

  try {
    const [propertyResult] = await db.query(
      "SELECT unit_id, property_id FROM LeaseAgreement INNER JOIN Unit USING(unit_id) WHERE agreement_id = ?",
      [agreement_id]
    );

    if (!propertyResult.length) {
      return NextResponse.json({ announcements: [] });
    }

    const property_id = propertyResult[0].property_id;

    // Get announcements for this specific property
    const [announcements] = await db.query(
      `SELECT 
                announcement_id, 
                subject, 
                description, 
                created_at
            FROM Announcement 
            WHERE property_id = ? 
            ORDER BY created_at DESC`,
      [property_id]
    );

    // For each announcement, fetch and decrypt associated photos
    const announcementsWithPhotos = await Promise.all(
      announcements.map(async (ann: any) => {
        const [photos] = await db.query(
          `SELECT 
                        photo_id,
                        photo_url,
                        created_at
                    FROM AnnouncementPhoto
                    WHERE announcement_id = ?
                    ORDER BY photo_id ASC`,
          [ann.announcement_id]
        );

        // Decrypt photo URLs
        const decryptedPhotos = photos
          .map((photo: any) => {
            if (!photo.photo_url) return null;

            try {
              // Parse the encrypted JSON string
              const encryptedData = JSON.parse(photo.photo_url);

              // Decrypt the URL
              const decryptedUrl = decryptData(encryptedData, encryptionSecret);

              // Validate it's a proper URL
              if (
                typeof decryptedUrl === "string" &&
                decryptedUrl.length > 0 &&
                (decryptedUrl.startsWith("http://") ||
                  decryptedUrl.startsWith("https://") ||
                  decryptedUrl.startsWith("/"))
              ) {
                return decryptedUrl;
              }
            } catch (err) {
              console.error("Photo URL decryption error:", err);
              // If it's already a plain URL (not encrypted), use it directly
              if (
                typeof photo.photo_url === "string" &&
                (photo.photo_url.startsWith("http://") ||
                  photo.photo_url.startsWith("https://") ||
                  photo.photo_url.startsWith("/"))
              ) {
                return photo.photo_url;
              }
            }

            return null;
          })
          .filter(Boolean); // Remove null values

        return {
          announcement_id: ann.announcement_id,
          subject: ann.subject,
          description: ann.description,
          created_at: ann.created_at,
          photo_urls: decryptedPhotos,
        };
      })
    );

    return NextResponse.json({ announcements: announcementsWithPhotos });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return NextResponse.json(
      { error: "Failed to fetch announcements." },
      { status: 500 }
    );
  }
}
