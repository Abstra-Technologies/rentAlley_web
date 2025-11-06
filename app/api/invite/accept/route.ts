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
        const body = await req.json();
        const { inviteCode, userId } = body;

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

        // 2️⃣ Get tenant_id using userId
        const [tenantRows]: any = await conn.query(
            `SELECT tenant_id FROM Tenant WHERE user_id = ?`,
            [userId]
        );
        const tenant = tenantRows[0];

        if (!tenant) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Tenant account not found for this user." },
                { status: 404 }
            );
        }

        // 3️⃣ Get lease dates from InviteCode
        const leaseStart = invite.start_date ? new Date(invite.start_date) : null;
        const leaseEnd = invite.end_date ? new Date(invite.end_date) : null;

        if (!leaseStart || !leaseEnd) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Lease dates not found in invite." },
                { status: 400 }
            );
        }

        // 4️⃣ Generate unique Lease ID
        let leaseId = generateLeaseId();
        let [exists]: any = await conn.query(
            `SELECT 1 FROM LeaseAgreement WHERE agreement_id = ?`,
            [leaseId]
        );

        // Regenerate until unique
        while (exists.length > 0) {
            leaseId = generateLeaseId();
            [exists] = await conn.query(
                `SELECT 1 FROM LeaseAgreement WHERE agreement_id = ?`,
                [leaseId]
            );
        }

        // 5️⃣ Create lease record (mark as ACTIVE)
        await conn.query(
            `INSERT INTO LeaseAgreement (
          agreement_id, tenant_id, unit_id, start_date, end_date, status,
          is_security_deposit_paid, is_advance_payment_paid
       ) VALUES (?, ?, ?, ?, ?, 'active', 1, 1)`,
            [leaseId, tenant.tenant_id, invite.unitId, leaseStart, leaseEnd]
        );

        // 6️⃣ Update InviteCode → USED
        await conn.query(
            `UPDATE InviteCode SET status = 'USED' WHERE code = ?`,
            [inviteCode]
        );

        // 7️⃣ Mark Unit → OCCUPIED
        await conn.query(
            `UPDATE Unit
             SET status = 'occupied', updated_at = CURRENT_TIMESTAMP
             WHERE unit_id = ?`,
            [invite.unitId]
        );

        // 8️⃣ Fetch landlord info
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
            const unitId = landlordRows[0].unit_id;
            const propertyId = landlordRows[0].property_id;

            const notifTitle = `Tenant Invite Accepted - ${propertyName} / ${unitName}`;
            const notifBody = `Your tenant has accepted the invite. The lease is now active for ${propertyName} - ${unitName}.`;
            const notifUrl = `/pages/landlord/property-listing/view-unit/${propertyId}/unit-details/${unitId}`;

            // 9️⃣ Save landlord notification
            await conn.query(
                `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
                 VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
                [landlordUserId, notifTitle, notifBody, notifUrl]
            );

            // 🔟 Push notification
            const [subs]: any = await conn.query(
                `SELECT endpoint, p256dh, auth
                 FROM user_push_subscriptions
                 WHERE user_id = ?`,
                [landlordUserId]
            );

            if (subs.length > 0) {
                const payload = JSON.stringify({
                    title: notifTitle,
                    body: notifBody,
                    url: notifUrl,
                });

                for (const sub of subs) {
                    const subscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    };

                    try {
                        await webpush.sendNotification(subscription, payload);
                        console.log("✅ Push sent to landlord:", sub.endpoint);
                    } catch (err: any) {
                        console.error("❌ Push failed:", err.message);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await conn.query(
                                `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                                [sub.endpoint]
                            );
                            console.log("🗑️ Removed invalid subscription:", sub.endpoint);
                        }
                    }
                }
            }
        }

        await conn.commit();
        return NextResponse.json({
            success: true,
            message: "Lease created, unit marked occupied, landlord notified.",
            lease_id: leaseId,
        });
    } catch (error: any) {
        console.error("Invite accept error:", error);
        await conn.rollback();
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        conn.release();
    }
}
