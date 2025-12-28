import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

/**
 * End Lease (ONLY after lease naturally ends)
 * Status → completed
 * POST /api/landlord/activeLease/endLease
 */
export async function POST(req: NextRequest) {
    let connection;
    try {
        const { agreement_id } = await req.json();

        if (!agreement_id) {
            return NextResponse.json(
                { message: "agreement_id is required" },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        /* ===============================
           FETCH LEASE
        ================================ */
        const [[lease]]: any = await connection.query(
            `
            SELECT
                la.agreement_id,
                la.status,
                la.end_date,
                la.unit_id,
                u.unit_name,
                p.property_name,
                t.user_id AS tenant_user_id
            FROM LeaseAgreement la
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            JOIN Tenant t ON la.tenant_id = t.tenant_id
            WHERE la.agreement_id = ?
            `,
            [agreement_id]
        );

        if (!lease) {
            return NextResponse.json(
                { message: "Lease not found" },
                { status: 404 }
            );
        }

        /* ===============================
           ⛔ STRICT END-DATE CHECK
        ================================ */
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const leaseEnd = lease.end_date
            ? new Date(lease.end_date)
            : null;

        if (!leaseEnd || leaseEnd > today) {
            return NextResponse.json(
                { message: "Lease cannot be ended before its end date" },
                { status: 409 }
            );
        }

        if (!["active", "expired"].includes(lease.status)) {
            return NextResponse.json(
                {
                    message: `Lease cannot be completed in '${lease.status}' state`,
                },
                { status: 409 }
            );
        }

        /* ===============================
           TRANSACTION
        ================================ */
        await connection.beginTransaction();

        // 1️⃣ Mark lease as COMPLETED (natural end)
        await connection.query(
            `
            UPDATE LeaseAgreement
            SET status = 'completed',
                updated_at = NOW()
            WHERE agreement_id = ?
            `,
            [agreement_id]
        );

        // 2️⃣ Release unit
        await connection.query(
            `
            UPDATE Unit
            SET status = 'unoccupied',
                updated_at = NOW()
            WHERE unit_id = ?
            `,
            [lease.unit_id]
        );

        /* ===============================
           🔔 NOTIFICATION
        ================================ */
        const title = "📄 Lease Completed";
        const bodyHtml = `
            Your lease for <b>${lease.property_name}</b> – <b>${lease.unit_name}</b>
            has officially ended and is now marked as completed.
        `;
        const redirectUrl = "/pages/tenant/leases";

        await connection.query(
            `
            INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
            VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
            `,
            [lease.tenant_user_id, title, bodyHtml, redirectUrl]
        );

        /* ===============================
           WEB PUSH
        ================================ */
        const [subs]: any = await connection.query(
            `
            SELECT endpoint, p256dh, auth
            FROM user_push_subscriptions
            WHERE user_id = ?
            `,
            [lease.tenant_user_id]
        );

        if (subs.length > 0) {
            const payload = JSON.stringify({
                title,
                body: bodyHtml.replace(/<[^>]*>/g, ""),
                url: redirectUrl,
                icon: `${process.env.NEXT_PUBLIC_BASE_URL}/icons/notification-icon.png`,
            });

            for (const sub of subs) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        payload
                    );
                } catch (err: any) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await connection.query(
                            `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                            [sub.endpoint]
                        );
                    }
                }
            }
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Lease completed successfully",
        });
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("END LEASE ERROR:", error);
        return NextResponse.json(
            { message: "Failed to complete lease" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
