import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { userId, subscription, userAgent } = await req.json();

        if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid subscription payload" }), { status: 400 });
        }

        const { endpoint } = subscription;
        const p256dh = subscription.keys.p256dh;
        const auth = subscription.keys.auth;

        await db.query(
            `INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth), user_agent = VALUES(user_agent)`,
            [userId, endpoint, p256dh, auth, userAgent || null]
        );

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e: any) {
        console.error("subscribe error:", e);
        return new Response(JSON.stringify({ ok: false }), { status: 500 });
    }
}
