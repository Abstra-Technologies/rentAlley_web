import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.ENCRYPTION_SECRET!;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ landlord_id: string }> }
) {
    const { landlord_id: landlordId } = await params;

    if (!landlordId) {
        return NextResponse.json(
            { message: "Landlord ID is required." },
            { status: 400 }
        );
    }

    try {
        /* ---------------- LANDLORD ---------------- */
        const [landlordRows] = await db.query<any[]>(
            `SELECT landlord_id, user_id, is_verified, createdAt
       FROM Landlord
       WHERE landlord_id = ?
       LIMIT 1`,
            [landlordId]
        );

        if (!landlordRows || landlordRows.length === 0) {
            return NextResponse.json(
                { message: "Landlord not found" },
                { status: 404 }
            );
        }

        /* ---------------- VERIFICATION ---------------- */
        const [verificationRows] = await db.query<any[]>(
            `SELECT *
       FROM LandlordVerification
       WHERE landlord_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
            [landlordId]
        );

        const verification =
            verificationRows.length > 0
                ? {
                    ...verificationRows[0],
                    selfie_url: verificationRows[0].selfie_url
                        ? decryptData(
                            JSON.parse(verificationRows[0].selfie_url),
                            SECRET
                        )
                        : null,
                    document_url: verificationRows[0].document_url
                        ? decryptData(
                            JSON.parse(verificationRows[0].document_url),
                            SECRET
                        )
                        : null,
                }
                : null;

        return NextResponse.json({
            landlord: landlordRows[0],
            verification,
        });
    } catch (error: any) {
        console.error("[GET LANDLORD VERIFICATION DETAILS]", error);
        return NextResponse.json(
            { message: "Database error", error: error.message },
            { status: 500 }
        );
    }
}
