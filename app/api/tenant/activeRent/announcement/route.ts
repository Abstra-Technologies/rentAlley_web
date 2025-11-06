import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { redis } from "@/lib/redis"; // make sure you export Redis client from /lib/redis

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tenant_id = searchParams.get("tenant_id");

        if (!tenant_id) {
            return NextResponse.json(
                { error: "tenant_id is required" },
                { status: 400 }
            );
        }

        const cacheKey = `announcements:tenant:${tenant_id}`;

        // 🔹 1. Try cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            return NextResponse.json({ announcements: cached }, { status: 200 });
        }

        // 🔹 2. Query DB if no cache
        const [rows]: any = await db.query(
            `
        SELECT
            a.announcement_id,
            a.subject,
            a.description,
            a.created_at,
            p.property_name,
            u.unit_name,
            ap.photo_url,
            lu.firstName AS landlord_firstName,
            lu.lastName AS landlord_lastName,
            lu.profilePicture AS landlord_profilePicture
        FROM Announcement a
                 INNER JOIN Property p ON a.property_id = p.property_id
                 INNER JOIN Unit u ON u.property_id = p.property_id
                 INNER JOIN LeaseAgreement la ON la.unit_id = u.unit_id
                 INNER JOIN Landlord l ON a.landlord_id = l.landlord_id
                 INNER JOIN User lu ON l.user_id = lu.user_id
                 LEFT JOIN AnnouncementPhoto ap ON ap.announcement_id = a.announcement_id
        WHERE la.tenant_id = ?
          AND la.status = 'active'
        ORDER BY a.created_at DESC
      `,
            [tenant_id]
        );

        const announcementsMap: Record<number, any> = {};

        rows.forEach((row: any) => {
            if (!announcementsMap[row.announcement_id]) {
                // Decrypt landlord fields
                let firstName: string | null = null;
                let lastName: string | null = null;
                let profilePic: string | null = null;

                if (row.landlord_firstName) {
                    try {
                        const encryptedData = JSON.parse(row.landlord_firstName);
                        // @ts-ignore
                        firstName = decryptData(encryptedData, encryptionSecret);
                    } catch (err) {
                        console.error("First name decryption error:", err);
                        firstName = row.landlord_firstName; // fallback
                    }
                }

                if (row.landlord_lastName) {
                    try {
                        const encryptedData = JSON.parse(row.landlord_lastName);
                        // @ts-ignore
                        lastName = decryptData(encryptedData, encryptionSecret);
                    } catch (err) {
                        console.error("Last name decryption error:", err);
                        lastName = row.landlord_lastName; // fallback
                    }
                }

                if (row.landlord_profilePicture) {
                    try {
                        const encryptedData = JSON.parse(row.landlord_profilePicture);
                        // @ts-ignore
                        profilePic = decryptData(encryptedData, encryptionSecret);
                    } catch (err) {
                        console.error("Profile picture decryption error:", err);
                    }
                }

                announcementsMap[row.announcement_id] = {
                    id: row.announcement_id,
                    subject: row.subject,
                    description: row.description,
                    property_name: row.property_name,
                    unit_name: row.unit_name,
                    created_at: row.created_at,
                    landlord: {
                        firstName,
                        lastName,
                        profilePicture: profilePic,
                    },
                    photos: [] as string[],
                };
            }

            // Decrypt announcement photos
            if (row.photo_url) {
                try {
                    const encryptedData = JSON.parse(row.photo_url);
                    const decryptedUrl = decryptData(encryptedData, encryptionSecret);
                    announcementsMap[row.announcement_id].photos.push(decryptedUrl);
                } catch (decryptionError) {
                    console.error("Announcement photo decryption error:", decryptionError);
                    announcementsMap[row.announcement_id].photos.push(null);
                }
            }
        });

        const announcements = Object.values(announcementsMap);

        // 🔹 3. Save in cache with TTL (e.g., 60 sec)
        await redis.set(cacheKey, announcements, { ex: 60 });

        return NextResponse.json({ announcements }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json(
            { error: "Failed to fetch announcements: " + error.message },
            { status: 500 }
        );
    }
}
