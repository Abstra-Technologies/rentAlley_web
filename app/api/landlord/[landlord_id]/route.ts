import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { RowDataPacket, FieldPacket } from "mysql2";
import { decryptData } from "@/crypto/encrypt";

/**
 * @endpoint
 * @used_by findrent landlord profile.
 * @inputs landlord_id (query)
 * @outputs status counts
 * @notes
 */


const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function GET(
    request: Request,
    context: { params: Promise<{ landlord_id: string }> }
) {
    const { landlord_id } = await context.params;

    // 🛑 HARD GUARD
    if (!landlord_id || typeof landlord_id !== "string") {
        return NextResponse.json(
            { message: "Invalid or missing landlord_id" },
            { status: 400 }
        );
    }

    try {
        /* ================================
           1. Landlord + User info
        ================================ */
        const [rows]: [RowDataPacket[], FieldPacket[]] = await db.execute(
            `
      SELECT
        l.landlord_id,
        u.firstName AS enc_firstName,
        u.lastName AS enc_lastName,
        u.email AS enc_email,
        u.phoneNumber AS enc_phone,
        u.profilePicture AS enc_profile
      FROM Landlord l
      JOIN User u ON l.user_id = u.user_id
      WHERE l.landlord_id = ?
      `,
            [landlord_id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Landlord not found" },
                { status: 404 }
            );
        }

        const landlord = rows[0] as any;

        /* ================================
           2. Decrypt fields
        ================================ */
        let firstName = "Unknown";
        let lastName = "";
        let email = "";
        let phone = "";
        let photoUrl: string | null = null;

        try {
            if (landlord.enc_firstName)
                firstName =
                    decryptData(JSON.parse(landlord.enc_firstName), SECRET_KEY) ||
                    firstName;

            if (landlord.enc_lastName)
                lastName =
                    decryptData(JSON.parse(landlord.enc_lastName), SECRET_KEY) || lastName;

            if (landlord.enc_email)
                email = decryptData(
                    JSON.parse(landlord.enc_email),
                    SECRET_KEY
                );

            if (landlord.enc_phone)
                phone = decryptData(
                    JSON.parse(landlord.enc_phone),
                    SECRET_KEY
                );

            if (landlord.enc_profile)
                photoUrl = decryptData(
                    JSON.parse(landlord.enc_profile),
                    SECRET_KEY
                );
        } catch (err) {
            console.error("Decryption failed:", err);
        }

        /* ================================
           3. Total properties (NEW)
        ================================ */
        const [propertyCountRows]: [RowDataPacket[], FieldPacket[]] =
            await db.execute(
                `
        SELECT COUNT(*) AS totalProperties
        FROM Property
        WHERE landlord_id = ?
        `,
                [landlord_id]
            );

        const totalProperties =
            propertyCountRows[0]?.totalProperties ?? 0;

        /* ================================
           4. Response
        ================================ */
        return NextResponse.json({
            landlord_id: landlord.landlord_id,
            name: `${firstName} ${lastName}`.trim(),
            email,
            phone,
            photoUrl,
            totalProperties,
        });
    } catch (error) {
        console.error("Error fetching landlord:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST() {
    return NextResponse.json(
        { message: "Method not allowed" },
        { status: 405 }
    );
}
