import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";

type VerificationStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "not verified";

export async function GET(req: NextRequest) {
    try {
        /* ------------------------------------------------
           1. Authenticate user via cookie JWT
        ------------------------------------------------ */
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies?.token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(cookies.token, secret);
        const user_id = payload.user_id as string;

        /* ------------------------------------------------
           2. Resolve landlord
        ------------------------------------------------ */
        const [landlords]: any = await db.query(
            `
            SELECT landlord_id, is_verified
            FROM Landlord
            WHERE user_id = ?
            LIMIT 1
            `,
            [user_id]
        );

        if (!landlords.length) {
            return NextResponse.json(
                { error: "Landlord not found" },
                { status: 404 }
            );
        }

        const landlord = landlords[0];

        /* ------------------------------------------------
           3. If already verified → short-circuit
        ------------------------------------------------ */
        if (landlord.is_verified === 1) {
            return NextResponse.json({
                status: "approved",
            });
        }

        /* ------------------------------------------------
           4. Get latest verification record
        ------------------------------------------------ */
        const [verifications]: any = await db.query(
            `
            SELECT status
            FROM LandlordVerification
            WHERE landlord_id = ?
            ORDER BY updated_at DESC
            LIMIT 1
            `,
            [landlord.landlord_id]
        );

        let status: VerificationStatus = "not verified";

        if (verifications.length) {
            status = verifications[0].status;
        }

        return NextResponse.json({ status });

    } catch (err) {
        console.error("[VERIFICATION_STATUS_ERROR]", err);

        return NextResponse.json(
            { error: "Failed to fetch verification status" },
            { status: 500 }
        );
    }
}
