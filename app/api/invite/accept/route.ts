import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";
import { generateLeaseId } from "@/utils/id_generator";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function POST(req: Request) {
    const conn = await db.getConnection();

    try {
        const { inviteCode, userId } = await req.json();

        if (!inviteCode || !userId) {
            return NextResponse.json(
                { error: "Missing invite code or user ID" },
                { status: 400 }
            );
        }

        await conn.beginTransaction();

        /* ===============================
           1️⃣ Validate invite
        =============================== */
        const [inviteRows]: any = await conn.query(
            `SELECT * FROM InviteCode WHERE code = ? AND status = 'PENDING'`,
            [inviteCode]
        );

        const invite = inviteRows[0];
        if (!invite) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite not found or already used." },
                { status: 404 }
            );
        }

        if (new Date(invite.expiresAt) < new Date()) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite has expired." },
                { status: 410 }
            );
        }

        /* ===============================
           2️⃣ Get tenant
        =============================== */
        const [tenantRows]: any = await conn.query(
            `SELECT tenant_id FROM Tenant WHERE user_id = ?`,
            [userId]
        );

        const tenant = tenantRows[0];
        if (!tenant) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Tenant account not found." },
                { status: 404 }
            );
        }

        /* ===============================
           3️⃣ Prepare lease data
        =============================== */
        const leaseId = generateLeaseId();

        const leaseStart = invite.start_date ?? null;
        const leaseEnd = invite.end_date ?? null;

        /* ===============================
           4️⃣ Create LeaseAgreement (DRAFT)
        =============================== */
        await conn.query(
            `
      INSERT INTO LeaseAgreement (
        agreement_id,
        tenant_id,
        unit_id,
        start_date,
        end_date,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, 'draft', NOW())
      `,
            [
                leaseId,
                tenant.tenant_id,
                invite.unitId,
                leaseStart,
                leaseEnd,
            ]
        );

        /* ===============================
           5️⃣ Mark invite as USED
        =============================== */
        await conn.query(
            `UPDATE InviteCode SET status = 'USED' WHERE code = ?`,
            [inviteCode]
        );

        /* ===============================
           6️⃣ Mark unit as OCCUPIED
        =============================== */
        await conn.query(
            `
      UPDATE Unit
      SET status = 'occupied',
          updated_at = CURRENT_TIMESTAMP
      WHERE unit_id = ?
      `,
            [invite.unitId]
        );

        /* ===============================
           7️⃣ Notify landlord
        =============================== */
        const [landlordRows]: any = await conn.query(
            `
      SELECT l.user_id,
             p.property_name,
             u.unit_name,
             u.unit_id,
             p.property_id
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      JOIN Landlord l ON p.landlord_id = l.landlord_id
      WHERE u.unit_id = ?
      `,
            [invite.unitId]
        );

        if (landlordRows.length > 0) {
            const landlordUserId = landlordRows[0].user_id;
            const propertyName = landlordRows[0].property_name;
            const unitName = landlordRows[0].unit_name;
            const propertyId = landlordRows[0].property_id;
            const unitId = landlordRows[0].unit_id;

            const notifTitle = `Tenant Accepted – ${propertyName} / ${unitName}`;
            const notifBody = `A tenant has accepted the invite. Lease is now in draft status.`;
            const notifUrl = `/pages/landlord/property-listing/view-unit/${propertyId}/unit-details/${unitId}`;

            // DB notification
            await conn.query(
                `
        INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        `,
                [landlordUserId, notifTitle, notifBody, notifUrl]
            );

            // Push notification
            const [subs]: any = await conn.query(
                `
        SELECT endpoint, p256dh, auth
        FROM user_push_subscriptions
        WHERE user_id = ?
        `,
                [landlordUserId]
            );

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
                        JSON.stringify({
                            title: notifTitle,
                            body: notifBody,
                            url: notifUrl,
                        })
                    );
                } catch (err: any) {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        await conn.query(
                            `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                            [sub.endpoint]
                        );
                    }
                }
            }
        }

        await conn.commit();

        return NextResponse.json({
            success: true,
            message: "Invite accepted. Lease created in draft state.",
            lease_id: leaseId,
        });

    } catch (error) {
        console.error("Invite accept error:", error);
        await conn.rollback();
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
