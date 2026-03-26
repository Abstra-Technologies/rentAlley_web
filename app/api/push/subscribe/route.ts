import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { userId, adminId, subscription, userAgent } = await req.json();

        if ((!userId && !adminId) || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid subscription payload" }), { status: 400 });
        }

        if (userId) {
            const [existingUser]: any = await db.query(
                `SELECT user_id FROM User WHERE user_id = ?`,
                [userId]
            );

            if (!existingUser || existingUser.length === 0) {
                return new Response(JSON.stringify({ ok: false, error: "User not found" }), { status: 404 });
            }
        }

        if (adminId) {
            const [existingAdmin]: any = await db.query(
                `SELECT admin_id FROM Admin WHERE admin_id = ?`,
                [adminId]
            );

            if (!existingAdmin || existingAdmin.length === 0) {
                return new Response(JSON.stringify({ ok: false, error: "Admin not found" }), { status: 404 });
            }
        }

        const { endpoint } = subscription;
        const p256dh = subscription.keys.p256dh;
        const auth = subscription.keys.auth;

        if (adminId) {
            await db.query(
                `INSERT INTO user_push_subscriptions (admin_id, endpoint, p256dh, auth, user_agent)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE admin_id = VALUES(admin_id), p256dh = VALUES(p256dh), auth = VALUES(auth), user_agent = VALUES(user_agent)`,
                [adminId, endpoint, p256dh, auth, userAgent || null]
            );
        } else {
            await db.query(
                `INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth), user_agent = VALUES(user_agent)`,
                [userId, endpoint, p256dh, auth, userAgent || null]
            );
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e: any) {
        console.error("subscribe error:", e);
        return new Response(JSON.stringify({ ok: false }), { status: 500 });
    }
}
