import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

/* -------------------------------------------------- */
/* GET - Check if agreement already accepted         */
/* -------------------------------------------------- */

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ landlordId: string }> }
) {
    const { landlordId } = await context.params;

    if (!landlordId) {
        return NextResponse.json(
            { error: "Invalid landlord ID" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.execute(
            `SELECT id, accepted_at
             FROM LandlordPlatformAgreement
             WHERE landlord_id = ?
             AND is_active = 1
             LIMIT 1`,
            [landlordId]
        );

        return NextResponse.json({
            accepted: rows.length > 0,
            accepted_at: rows[0]?.accepted_at ?? null,
        });

    } catch (error) {
        console.error("Agreement GET error:", error);
        return NextResponse.json(
            { error: "Failed to check agreement" },
            { status: 500 }
        );
    }
}

/* -------------------------------------------------- */
/* POST - Accept agreement                           */
/* -------------------------------------------------- */

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ landlordId: string }> }
) {
    const { landlordId } = await context.params;

    if (!landlordId) {
        return NextResponse.json(
            { error: "Invalid landlord ID" },
            { status: 400 }
        );
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Check if already accepted
        const [existing]: any = await connection.execute(
            `SELECT id FROM LandlordPlatformAgreement
             WHERE landlord_id = ?
             AND is_active = 1
             LIMIT 1`,
            [landlordId]
        );

        if (existing.length > 0) {
            await connection.rollback();
            connection.release();

            return NextResponse.json({
                message: "Agreement already accepted.",
                accepted: true,
            });
        }

        /* -----------------------------------------
           Capture Legal Metadata
        ----------------------------------------- */

        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0] ||
            req.headers.get("x-real-ip") ||
            "unknown";

        const userAgent =
            req.headers.get("user-agent") || "unknown";

        // Agreement content versioning
        const agreementVersion = "v1.0";

        // Hash agreement text (must match your frontend text)
        const agreementText =
            "Upkyp Platform Agreement v1.0 - Terms and Conditions...";
        const agreementHash = crypto
            .createHash("sha256")
            .update(agreementText)
            .digest("hex");

        const agreementId = crypto.randomUUID();

        await connection.execute(
            `INSERT INTO LandlordPlatformAgreement
             (id, landlord_id, agreement_version, agreement_hash,
              ip_address, user_agent, is_active)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [
                agreementId,
                landlordId,
                agreementVersion,
                agreementHash,
                ip,
                userAgent,
            ]
        );

        await connection.commit();
        connection.release();

        return NextResponse.json({
            message: "Agreement accepted successfully.",
            accepted: true,
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error("Agreement POST error:", error);

        return NextResponse.json(
            { error: "Failed to accept agreement" },
            { status: 500 }
        );
    }
}
