import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");

    if (!signature) {
        return NextResponse.json(
            { error: "Missing signature" },
            { status: 400 }
        );
    }

    /* ----------------------------------------------------
       1. Verify DIDDIT webhook signature (HMAC SHA256)
    ---------------------------------------------------- */
    const expectedSignature = crypto
        .createHmac("sha256", process.env.DIDDIT_WEBHOOK_SECRET_KEY!)
        .update(rawBody)
        .digest("hex");

    if (signature !== expectedSignature) {
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
        );
    }

    /* ----------------------------------------------------
       2. Parse payload AFTER verification
    ---------------------------------------------------- */
    const payload = JSON.parse(rawBody);

    const landlord_id = payload.vendor_data;
    const status = payload.status;

    if (!landlord_id || !status) {
        return NextResponse.json(
            { error: "Invalid payload" },
            { status: 400 }
        );
    }

    /* ----------------------------------------------------
       3. Normalize DIDDIT status → internal status
    ---------------------------------------------------- */
    let verificationStatus: "approved" | "rejected" | "pending" | "not verified" =
        "not verified";

    if (status === "approved") verificationStatus = "approved";
    else if (status === "rejected") verificationStatus = "rejected";
    else if (status === "pending") verificationStatus = "pending";

    /* ----------------------------------------------------
       4. ACID TRANSACTION
    ---------------------------------------------------- */
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        /* ----------------------------------------------
           4a. Idempotency check
           If already approved, do NOTHING
        ---------------------------------------------- */
        const [existing]: any = await connection.execute(
            `
      SELECT status
      FROM LandlordVerification
      WHERE landlord_id = ?
      LIMIT 1
      `,
            [landlord_id]
        );

        if (
            existing.length &&
            existing[0].status === "approved"
        ) {
            await connection.commit();
            return NextResponse.json({ success: true });
        }

        /* ----------------------------------------------
           4b. Upsert verification record
        ---------------------------------------------- */
        await connection.execute(
            `
      INSERT INTO LandlordVerification
        (landlord_id, status, message)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        message = VALUES(message),
        updated_at = NOW()
      `,
            [
                landlord_id,
                verificationStatus,
                payload.decision?.reason || null,
            ]
        );

        /* ----------------------------------------------
           4c. Update landlord FINAL verification gate
           ONLY if approved
        ---------------------------------------------- */
        if (verificationStatus === "approved") {
            await connection.execute(
                `
        UPDATE Landlord
        SET is_verified = 1
        WHERE landlord_id = ?
        `,
                [landlord_id]
            );
        }

        await connection.commit();

        return NextResponse.json({ success: true });

    } catch (err) {
        await connection.rollback();
        console.error("[DIDDIT_WEBHOOK_ERROR]", err);

        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
