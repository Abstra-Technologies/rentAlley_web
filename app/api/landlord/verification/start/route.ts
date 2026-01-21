import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
    try {
        /* -------------------------------
           1. Resolve user from session
        ------------------------------- */
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies?.token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(cookies.token, secretKey);
        const user_id = payload.user_id;

        /* -------------------------------
           2. Resolve landlord
        ------------------------------- */
        const [rows]: any = await db.query(
            `
      SELECT landlord_id, is_verified
      FROM Landlord
      WHERE user_id = ?
      LIMIT 1
      `,
            [user_id]
        );

        if (!rows.length) {
            return NextResponse.json(
                { error: "Landlord not found" },
                { status: 404 }
            );
        }

        const landlord = rows[0];

        if (landlord.is_verified === 1) {
            return NextResponse.json(
                { error: "Landlord already verified" },
                { status: 400 }
            );
        }

        /* -------------------------------
           3. Create DIDIT session (API FULL FLOW)
        ------------------------------- */
        const diditResponse = await axios.post(
            "https://verification.didit.me/v2/session/",
            {
                workflow_id: process.env.DIDDIT_WORKFLOW_ID,
                vendor_data: landlord.landlord_id,
                callback: process.env.DIDDIT_WEBHOOK_URL,
            },
            {
                headers: {
                    "X-Api-Key": process.env.DIDDIT_API_KEY!,
                    "Content-Type": "application/json",
                },
                timeout: 15000,
            }
        );

        const redirect_url = diditResponse.data?.url;

        if (!redirect_url) {
            console.error("[DIDIT RAW RESPONSE]", diditResponse.data);
            throw new Error("No redirect URL returned by DIDIT");
        }

        /* -------------------------------
           4. Upsert LandlordVerification (pending)
        ------------------------------- */
        await db.query(
            `
      INSERT INTO LandlordVerification
        (landlord_id, status)
      VALUES (?, 'pending')
      ON DUPLICATE KEY UPDATE
        status = 'pending',
        updated_at = NOW()
      `,
            [landlord.landlord_id]
        );

        return NextResponse.json({ redirect_url });

    } catch (error: any) {
        console.error(
            "[DIDDIT_VERIFICATION_START_ERROR]",
            error?.response?.data || error
        );

        return NextResponse.json(
            { error: "Failed to create DIDIT verification session" },
            { status: 500 }
        );
    }
}
