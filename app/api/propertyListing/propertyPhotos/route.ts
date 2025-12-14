import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    /* --------------------------------------------------
       REDIS CACHE KEY
       - scoped per property
       - fallback for "all photos"
    -------------------------------------------------- */
    const cacheKey = property_id
        ? `property:photos:${property_id}`
        : `property:photos:all`;

    try {
        /* --------------------------------------------------
           CHECK CACHE FIRST
        -------------------------------------------------- */
        const cached = await redis.get(cacheKey);
        if (cached) {
            let parsed;
            try {
                parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
            } catch (err) {
                console.error("PropertyPhoto cache parse error:", err);
                parsed = cached;
            }

            return NextResponse.json(parsed, { status: 200 });
        }

        /* --------------------------------------------------
           DATABASE QUERY
        -------------------------------------------------- */
        let query = `SELECT * FROM PropertyPhoto`;
        const params: any[] = [];

        if (property_id) {
            query += ` WHERE property_id = ?`;
            params.push(property_id);
        }

        const [rows]: any = await db.query(query, params);

        /* --------------------------------------------------
           DECRYPT PHOTOS (ONCE)
        -------------------------------------------------- */
        const decryptedRows = rows.map((row: any) => {
            try {
                const encryptedData = JSON.parse(row.photo_url);
                const decryptedUrl = decryptData(
                    encryptedData,
                    encryptionSecret
                );

                return {
                    ...row,
                    photo_url: decryptedUrl,
                };
            } catch (err) {
                console.error("PropertyPhoto decrypt error:", err);
                return {
                    ...row,
                    photo_url: null,
                };
            }
        });

        /* --------------------------------------------------
           CACHE RESULT (longer TTL is OK here)
        -------------------------------------------------- */
        await redis.set(
            cacheKey,
            JSON.stringify(decryptedRows),
            { ex: 300 } // ⏱ 5 minutes
        );

        return NextResponse.json(decryptedRows, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching property photos:", error);

        return NextResponse.json(
            { error: "Failed to fetch property photos: " + error.message },
            { status: 500 }
        );
    }
}
