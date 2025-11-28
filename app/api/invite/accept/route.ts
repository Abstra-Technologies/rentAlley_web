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

        // 1️⃣ Validate invite
        const [inviteRows]: any = await conn.query(
            `SELECT * FROM InviteCode WHERE code = ? AND status = 'PENDING'`,
            [inviteCode]
        );

        const invite = inviteRows[0];
        if (!invite) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite code not found or already used." },
                { status: 404 }
            );
        }

        if (new Date(invite.expiresAt) < new Date()) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite code has expired." },
                { status: 410 }
            );
        }

        // 2️⃣ Get tenant_id
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

        // 3️⃣ Lease dates
        const leaseStart = invite.start_date ? new Date(invite.start_date) : null;
        const leaseEnd = invite.end_date ? new Date(invite.end_date) : null;

        if (!leaseStart || !leaseEnd) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Lease dates missing in invite." },
                { status: 400 }
            );
        }

        // 4️⃣ Try to find existing draft lease (created during invite)
        let leaseId: string;
        const [draftRows]: any = await conn.query(
            `SELECT agreement_id 
             FROM LeaseAgreement 
             WHERE unit_id = ? AND status = 'draft'
             ORDER BY created_at DESC
             LIMIT 1`,
            [invite.unitId]
        );

        if (draftRows.length > 0) {
            // 5️⃣ Update existing draft lease → ACTIVE
            leaseId = draftRows[0].agreement_id;

            await conn.query(
                `UPDATE LeaseAgreement
                 SET tenant_id = ?, 
                     start_date = ?, 
                     end_date = ?, 
                     status = 'active',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE agreement_id = ?`,
                [tenant.tenant_id, leaseStart, leaseEnd, leaseId]
            );

        } else {
            // 6️⃣ No draft found → Generate BACKUP lease
            leaseId = generateLeaseId();

            let [exists]: any = await conn.query(
                `SELECT 1 FROM LeaseAgreement WHERE agreement_id = ?`,
                [leaseId]
            );
            while (exists.length > 0) {
                leaseId = generateLeaseId();
                [exists] = await conn.query(
                    `SELECT 1 FROM LeaseAgreement WHERE agreement_id = ?`,
                    [leaseId]
                );
            }

            await conn.query(
                `INSERT INTO LeaseAgreement (
                    agreement_id, tenant_id, unit_id, start_date, end_date, status,
                    is_security_deposit_paid, is_advance_payment_paid, created_at
                ) VALUES (?, ?, ?, ?, ?, 'active', 1, 1, NOW())`,
                [leaseId, tenant.tenant_id, invite.unitId, leaseStart, leaseEnd]
            );
        }

        // 7️⃣ Mark invite as USED
        await conn.query(
            `UPDATE InviteCode SET status = 'USED' WHERE code = ?`,
            [inviteCode]
        );

        // 8️⃣ Mark unit as OCCUPIED
        await conn.query(
            `UPDATE Unit
             SET status = 'occupied', updated_at = CURRENT_TIMESTAMP
             WHERE unit_id = ?`,
            [invite.unitId]
        );

        // 9️⃣ Notify landlord
        const [landlordRows]: any = await conn.query(
            `SELECT l.user_id, p.property_name, u.unit_name, u.unit_id, p.property_id
             FROM Unit u
             JOIN Property p ON u.property_id = p.property_id
             JOIN Landlord l ON p.landlord_id = l.landlord_id
             WHERE u.unit_id = ?`,
            [invite.unitId]
        );

        if (landlordRows.length > 0) {
            const landlordUserId = landlordRows[0].user_id;
            const propertyName = landlordRows[0].property_name;
            const unitName = landlordRows[0].unit_name;
            const propertyId = landlordRows[0].property_id;
            const unitId = landlordRows[0].unit_id;

            const notifTitle = `Tenant Invite Accepted - ${propertyName} / ${unitName}`;
            const notifBody = `Your tenant has accepted the invite. The lease is now active.`;
            const notifUrl = `/pages/landlord/property-listing/view-unit/${propertyId}/unit-details/${unitId}`;

            // DB Notification
            await conn.query(
                `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
                 VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
                [landlordUserId, notifTitle, notifBody, notifUrl]
            );

            // Push notification
            const [subs]: any = await conn.query(
                `SELECT endpoint, p256dh, auth 
                 FROM user_push_subscriptions
                 WHERE user_id = ?`,
                [landlordUserId]
            );

            for (const sub of subs) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        },
                        JSON.stringify({ title: notifTitle, body: notifBody, url: notifUrl })
                    );
                } catch (err: any) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
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
            message: "Lease activated, unit marked occupied, landlord notified.",
            lease_id: leaseId,
        });

    } catch (error: any) {
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
