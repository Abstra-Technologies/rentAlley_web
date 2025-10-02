import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

interface Params {
    params: {
        id: string;
    };
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const prospectiveTenantId = params.id;
    const { decision } = await req.json();

    if (!["yes", "no"].includes(decision)) {
        return NextResponse.json({ error: "Invalid decision value. Must be 'yes' or 'no'." }, { status: 400 });
    }

    try {
        // Only allow update if already approved
        const [rows]: any = await db.query(
            `SELECT * FROM ProspectiveTenant WHERE id = ? AND status = 'approved'`,
            [prospectiveTenantId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Application not found or not approved." }, { status: 404 });
        }

        const prospective = rows[0];
        const unitId = prospective.unit_id;

        await db.query(
            `UPDATE ProspectiveTenant SET proceeded = ? WHERE id = ?`,
            [decision, prospectiveTenantId]
        );

        // Fetch landlord info from property/unit
        const [landlordRows]: any = await db.query(
            `SELECT l.user_id, p.property_name, u.unit_name, u.unit_id, p.property_id
             FROM Unit u
             JOIN Property p ON u.property_id = p.property_id
             JOIN Landlord l ON p.landlord_id = l.landlord_id
             WHERE u.unit_id = ?`,
            [unitId]
        );

        if (landlordRows.length > 0) {
            const landlordUserId = landlordRows[0].user_id;
            const propertyName = landlordRows[0].property_name;
            const unitName = landlordRows[0].unit_name;
            const propertyId = landlordRows[0].property_id;

            let notifTitle: string;
            let notifBody: string;
            let url: string = `/pages/landlord/property-listing/view-unit/${propertyId}/unit-details/${unitId}`;

            if (decision === "yes") {
                notifTitle = `Prospective Tenant Proceed - ${propertyName} - ${unitName}`;
                notifBody = `A prospective tenant has decided to proceed with the application for your unit (${propertyName} - ${unitName}). Please prepare the lease agreement.`;
            } else {
                notifTitle = `Prospective Tenant Declined - ${propertyName} - ${unitName}`;
                notifBody = `A prospective tenant has decided not to proceed with the application for your unit (${propertyName} - ${unitName}).`;
            }

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
                    url,
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
                            console.log("🗑️ Removed invalid subscription:", sub.endpoint);
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, proceeded: decision });
    } catch (error) {
        console.error("Error updating tenant decision:", error);
        return NextResponse.json({ error: "Database server error." }, { status: 500 });
    }
}