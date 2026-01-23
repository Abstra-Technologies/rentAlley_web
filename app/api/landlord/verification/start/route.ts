import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
    try {
        console.log("=== DIDIT VERIFICATION START ===");

        // 1. Auth & user resolution
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : {};

        if (!cookies.token) {
            console.warn("Missing auth token in cookies");
            return NextResponse.json({ error: "Unauthorized – no session token" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secret);
        const user_id = payload.user_id as string;

        if (!user_id) {
            console.warn("JWT missing user_id claim");
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        // 2. Find landlord
        const [rows]: any[] = await db.query(
            `SELECT landlord_id, is_verified FROM Landlord WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (rows.length === 0) {
            console.warn(`No landlord record for user_id: ${user_id}`);
            return NextResponse.json({ error: "Landlord profile not found" }, { status: 404 });
        }

        const { landlord_id, is_verified } = rows[0];

        if (is_verified === 1) {
            return NextResponse.json({ error: "Identity already verified" }, { status: 400 });
        }

        // 3. Validate env vars early
        if (!process.env.DIDDIT_API_KEY || !process.env.DIDDIT_WORKFLOW_ID) {
            console.error("Missing DIDIT API key or workflow ID in environment");
            return NextResponse.json(
                { error: "Server configuration error – please contact support" },
                { status: 500 }
            );
        }

        // 4. Create Didit session (use v3 endpoint)
        const diditRes = await axios.post(
            "https://verification.didit.me/v3/session/",
            {
                workflow_id: process.env.DIDDIT_WORKFLOW_ID,
                vendor_data: String(landlord_id), // explicit string
                callback: process.env.DIDDIT_REDIRECT_URL, // optional, but good for fallback
            },
            {
                headers: {
                    "X-Api-Key": process.env.DIDDIT_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 15000,
            }
        );

        const data = diditRes.data;

        // v3 response structure (flat)
        const redirect_url = data.url;
        const verification_session_id = data.session_id;

        if (!redirect_url || !verification_session_id) {
            console.error("Didit response missing required fields", {
                status: diditRes.status,
                responseData: data,
            });
            throw new Error("Invalid response from Didit verification service");
        }

        // 5. Save pending state
        await db.query(
            `
      INSERT INTO LandlordVerification 
        (landlord_id, status, verification_session_id, created_at)
      VALUES (?, 'pending', ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = 'pending',
        verification_session_id = VALUES(verification_session_id),
        updated_at = NOW()
      `,
            [landlord_id, verification_session_id]
        );

        console.log(`Verification session created – landlord: ${landlord_id}, session: ${verification_session_id}`);

        return NextResponse.json({ redirect_url });

    } catch (err: any) {
        console.error("[DIDIT_VERIFICATION_START_FAILED]", {
            message: err.message,
            status: err.response?.status,
            diditError: err.response?.data || null,
            stack: err.stack?.split("\n").slice(0, 3).join("\n"), // first 3 lines only
        });

        let clientMessage = "Failed to initiate identity verification";
        let statusCode = 500;

        if (err.response) {
            const { status, data } = err.response;
            if (status === 401 || status === 403) {
                clientMessage = "Authentication failed with verification provider";
                statusCode = 502; // bad gateway – provider auth issue
            } else if (status === 429) {
                clientMessage = "Rate limit reached – please try again in a minute";
                statusCode = 429;
            }
        }

        return NextResponse.json({ error: clientMessage }, { status: statusCode });
    }
}