import { NextRequest } from 'next/server';
import mysql from 'mysql2/promise';
import { parse } from 'cookie';
import { jwtVerify } from 'jose';
import { POINTS } from '@/constant/pointSystem/points';
import webpush from 'web-push';

// 🔑 Web Push keys (generate with web-push CLI if not yet)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

// Configure web-push
webpush.setVapidDetails(
    'mailto:your-email@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function POST(req: NextRequest) {
    try {
        // 🔐 JWT validation
        const cookieHeader = req.headers.get('cookie') || '';
        const cookies = parse(cookieHeader);
        const token = cookies.token;
        if (!token) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
        }

        let decoded;
        try {
            const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secretKey);
            decoded = payload;
        } catch (err: any) {
            return new Response(JSON.stringify({ success: false, message: err.message }), { status: 401 });
        }

        const currentadmin_id = decoded?.admin_id;
        if (!currentadmin_id) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid Token Data' }), { status: 401 });
        }

        // 📌 Parse input
        const { property_id, status, message } = await req.json();
        if (!property_id || !status) {
            return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
        }

        // 📌 Connect DB
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST!,
            user: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
            database: process.env.DB_NAME!,
            timezone: '+08:00',
        });

        // 📌 Find landlord user
        const [rows]: any = await connection.execute(
            `SELECT pv.status, pv.attempts, l.user_id
             FROM PropertyVerification pv
                      JOIN Property p ON pv.property_id = p.property_id
                      JOIN Landlord l ON p.landlord_id = l.landlord_id
                      JOIN User u ON l.user_id = u.user_id
             WHERE pv.property_id = ?`,
            [property_id]
        );

        if (rows.length === 0) {
            await connection.end();
            return new Response(JSON.stringify({ message: 'Property not found' }), { status: 404 });
        }

        const { status: currentStatus, attempts, user_id } = rows[0];

        if (!user_id) {
            await connection.end();
            return new Response(JSON.stringify({ message: 'Landlord not found for this property.' }), { status: 500 });
        }

        // 📌 Handle notifications + points
        if (currentStatus === 'Rejected' && attempts >= 2) {
            const notificationTitle = `Property ${status}`;
            const notificationBody = `Your property listing has been ${status.toLowerCase()} twice. ${message ? `Message: ${message}` : ''}`;

            await connection.execute(
                `INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`,
                [user_id, notificationTitle, notificationBody]
            );
        }

        if (status === 'Verified') {
            const verifiedTitle = 'Property Verified';
            const verifiedBody = `🎉 Congratulations! Your property has been verified. You’ve earned ${POINTS.PROPERTY_VERIFIED} FlexiPoints.`;

            await connection.execute(
                `INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`,
                [user_id, verifiedTitle, verifiedBody]
            );

            await connection.execute(
                `UPDATE User SET points = points + ? WHERE user_id = ?`,
                [POINTS.PROPERTY_VERIFIED, user_id]
            );
        }

        const newAttempts = status === 'Rejected' ? attempts + 1 : attempts;

        await connection.execute(
            `UPDATE PropertyVerification
             SET status = ?, admin_message = ?, reviewed_by = ?, attempts = ?
             WHERE property_id = ?`,
            [status, message || null, currentadmin_id, newAttempts, property_id]
        );

        // 📌 Always insert a Notification
        const notificationTitle = `Property ${status}`;
        const notificationBody = `Your property listing has been ${status.toLowerCase()}. ${message ? `Message: ${message}` : ''}`;

        await connection.execute(
            `INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`,
            [user_id, notificationTitle, notificationBody]
        );

        // 🔔 Fetch push subscriptions
        const [subs]: any = await connection.execute(
            `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
            [user_id]
        );

        await connection.end();

        if (subs.length > 0) {
            const payload = JSON.stringify({
                title: notificationTitle,
                body: notificationBody,
                url: "/", // where user should go when clicking
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
                    console.log("✅ Sent push notification:", sub.endpoint);
                } catch (err: any) {
                    console.error("❌ Failed push:", err);

                    // If subscription is no longer valid, remove it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        const conn = await mysql.createConnection({
                            host: process.env.DB_HOST!,
                            user: process.env.DB_USER!,
                            password: process.env.DB_PASSWORD!,
                            database: process.env.DB_NAME!,
                        });
                        await conn.execute(`DELETE FROM user_push_subscriptions WHERE endpoint = ?`, [sub.endpoint]);
                        await conn.end();
                        console.log("🗑️ Removed invalid subscription:", sub.endpoint);
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                message: `Property ${status.toLowerCase()} reviewed by Admin ${currentadmin_id}.`,
                attempts: newAttempts,
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error updating property status:', error);
        return new Response(JSON.stringify({ message: 'Error updating property status' }), { status: 500 });
    }
}
