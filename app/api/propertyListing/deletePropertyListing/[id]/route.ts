import { db } from "@/lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { decryptData } from "@/crypto/encrypt";
import { deleteFromS3 } from "@/lib/s3";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: propertyId } = await params;

    console.log("DELETE PROPERTY:", propertyId);

    if (!propertyId) {
        return NextResponse.json(
            { error: "Property ID is required" },
            { status: 400 }
        );
    }

    let connection;

    try {
        connection = await db.getConnection();

        /* =========================
           1. Property exists?
        ========================= */
        const [propertyRows]: any = await connection.execute(
            `SELECT property_id FROM Property WHERE property_id = ?`,
            [propertyId]
        );

        if (propertyRows.length === 0) {
            return NextResponse.json(
                { error: "Property not found" },
                { status: 404 }
            );
        }

        /* =========================
           2. Block active leases
        ========================= */
        const [activeLeases]: any = await connection.execute(
            `
      SELECT la.agreement_id
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      WHERE u.property_id = ? AND la.status = 'active'
      `,
            [propertyId]
        );

        if (activeLeases.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete property with active leases" },
                { status: 400 }
            );
        }

        /* =========================
           3. Fetch ALL encrypted S3 URLs
           (property photos + unit photos)
        ========================= */

        // Property photos
        const [propertyPhotos]: any = await connection.execute(
            `SELECT photo_url FROM PropertyPhoto WHERE property_id = ?`,
            [propertyId]
        );

        // Unit photos (via units)
        const [unitPhotos]: any = await connection.execute(
            `
      SELECT up.photo_url
      FROM UnitPhoto up
      JOIN Unit u ON up.unit_id = u.unit_id
      WHERE u.property_id = ?
      `,
            [propertyId]
        );

        /* =========================
           4. Delete property (CASCADE)
        ========================= */
        await connection.beginTransaction();

        await connection.execute(
            `DELETE FROM Property WHERE property_id = ?`,
            [propertyId]
        );

        await connection.commit();

        /* =========================
           5. Delete S3 files (AFTER commit)
        ========================= */
        const allPhotos = [...propertyPhotos, ...unitPhotos];

        await Promise.allSettled(
            allPhotos.map((row) => {
                try {
                    const decryptedUrl = decryptData(
                        JSON.parse(row.photo_url),
                        encryptionSecret
                    );
                    return deleteFromS3(decryptedUrl);
                } catch (err) {
                    console.error("Failed to delete S3 file:", err);
                    return Promise.resolve();
                }
            })
        );

        /* =========================
           6. Activity log
        ========================= */
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (cookies?.token) {
            const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload }: any = await jwtVerify(cookies.token, secretKey);

            if (payload?.user_id) {
                await db.query(
                    `
          INSERT INTO ActivityLog (user_id, action, timestamp)
          VALUES (?, ?, NOW())
          `,
                    [payload.user_id, `Deleted Property: ${propertyId}`]
                );
            }
        }

        return NextResponse.json(
            { message: "Property and related data deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error deleting property:", error);

        return NextResponse.json(
            { error: "Failed to delete property" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
