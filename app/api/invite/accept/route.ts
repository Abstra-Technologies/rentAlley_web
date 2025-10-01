import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inviteCode, userId, startDate, endDate } = body;

        if (!inviteCode || !userId) {
            return NextResponse.json(
                { error: "Missing invite code or user ID" },
                { status: 400 }
            );
        }

        // 1. Validate invite code
        const [inviteRows]: any = await db.query(
            `SELECT * FROM InviteCode WHERE code = ? AND status = 'PENDING'`,
            [inviteCode]
        );
        const invite = inviteRows[0];

        if (!invite) {
            return NextResponse.json(
                { error: "Invite code not found or already used." },
                { status: 404 }
            );
        }

        if (new Date(invite.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Invite code has expired." }, { status: 410 });
        }

        // 2. Get tenant_id using userId
        const [tenantRows]: any = await db.query(
            `SELECT tenant_id FROM Tenant WHERE user_id = ?`,
            [userId]
        );
        const tenant = tenantRows[0];

        if (!tenant) {
            return NextResponse.json(
                { error: "Tenant account not found for this user." },
                { status: 404 }
            );
        }

        // 3. Prepare dates
        const leaseStart = startDate ? new Date(startDate) : null;
        const leaseEnd = endDate ? new Date(endDate) : null;

        // 4. Insert lease agreement
        await db.query(
            `INSERT INTO LeaseAgreement (
                tenant_id, unit_id, start_date, end_date, status,
                is_security_deposit_paid, is_advance_payment_paid
            ) VALUES (?, ?, ?, ?, 'pending', 1, 1)`,
            [tenant.tenant_id, invite.unitId, leaseStart, leaseEnd]
        );

        // 5. Mark invite code as used
        await db.query(
            `UPDATE InviteCode SET status = 'USED' WHERE code = ?`,
            [inviteCode]
        );

        // 6. Fetch landlord info from property/unit
        const [landlordRows]: any = await db.query(
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

            const notifTitle = `Tenant Invite Accepted ${propertyName} - ${unitName}`;
            const notifBody = `A tenant has accepted your invite  for your unit (${propertyName} - ${unitName}). Please review/set the lease agreement.`;

            // Save notification
            await db.query(
                `INSERT INTO Notification (user_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
                [landlordUserId, notifTitle, notifBody]
            );

            // Fetch push subscriptions
            const [subs]: any = await db.query(
                `SELECT endpoint, p256dh, auth 
         FROM user_push_subscriptions 
         WHERE user_id = ?`,
                [landlordUserId]
            );

            if (subs.length > 0) {
                const payload = JSON.stringify({
                    title: notifTitle,
                    body: notifBody,
                    url: `/pages/landlord/property-listing/view-unit/${propertyId}/unit-details/${unitId}`,
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
                        console.log("✅ Sent push notification to landlord:", sub.endpoint);
                    } catch (err: any) {
                        console.error("❌ Failed push:", err);
                        // Remove invalid subscription
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await db.execute(
                                `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                                [sub.endpoint]
                            );
                            await db.end();
                            console.log("🗑️ Removed invalid subscription:", sub.endpoint);
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Invite redeem error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}