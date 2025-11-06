import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Announcement ID is required" },
        { status: 400 }
      );
    }

    // Fetch images for the announcement
    const query = `
      SELECT photo_id, photo_url, created_at
      FROM AnnouncementPhoto
      WHERE announcement_id = ?
      ORDER BY created_at ASC
    `;

    const [rows] = await db.execute(query, [id]);

    // Decrypt images server-side (like tenant API does)
    const decryptedRows = (rows as any[]).map((row) => {
      try {
        // Parse and decrypt the photo_url
        const parsed = JSON.parse(row.photo_url);
        const decryptedUrl = decryptData(parsed, encryptionSecret);

        return {
          ...row,
          photo_url: decryptedUrl, // Return plain URL
        };
      } catch (error) {
        console.error("Error decrypting image:", error);
        // If decryption fails, return original (might already be plain text)
        return row;
      }
    });

    return NextResponse.json(decryptedRows);
  } catch (error: any) {
    console.error("Error fetching announcement images:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
