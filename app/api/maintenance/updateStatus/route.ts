import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import webpush from "web-push";
import { io } from "socket.io-client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export const runtime = "nodejs";

function detectDevice(ua: string) {
    const agent = ua.toLowerCase();
    if (agent.includes("mobile")) return "mobile";
    if (agent.includes("tablet") || agent.includes("ipad")) return "tablet";
    return "web";
}

export async function PUT(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const deviceType = detectDevice(userAgent);
    const endpoint = req.url;
    const method = req.method;

    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;

    if (!cookies?.token) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(cookies.token, secret);
    const landlordUserId = payload.user_id;
    const sessionId = payload.session_id || payload.jti || null;

    if (!landlordUserId) {
        return NextResponse.json({ success: false, message: "Invalid token payload" }, { status: 401 });
    }

    const conn = await db.getConnection();
    try {
        const body = await req.json();
        const { request_id, status, schedule_date, completion_date } = body;

        if (!request_id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await conn.beginTransaction();

        // 1️⃣ Get existing maintenance record
        const [oldRows]: any = await conn.query(
            `SELECT * FROM MaintenanceRequest WHERE request_id = ?`,
            [request_id]
        );
        if (!oldRows.length) {
            await conn.rollback();
            return NextResponse.json({ error: "Maintenance request not found." }, { status: 404 });
        }

        // 2️⃣ Update status
        let updateQuery = `UPDATE MaintenanceRequest SET status = ?, updated_at = NOW()`;
        const params: any[] = [status];
        if (schedule_date) {
            updateQuery += `, schedule_date = ?`;
            params.push(schedule_date);
        }
        if (completion_date) {
            updateQuery += `, completion_date = ?`;
            params.push(completion_date);
        }
        updateQuery += ` WHERE request_id = ?`;
        params.push(request_id);

        await conn.query(updateQuery, params);

        // 3️⃣ Get tenant info
        const [rel]: any = await conn.query(
            `SELECT mr.tenant_id, t.user_id AS tenant_user_id, mr.subject
             FROM MaintenanceRequest mr
                      JOIN Tenant t ON mr.tenant_id = t.tenant_id
             WHERE mr.request_id = ?`,
            [request_id]
        );

        if (!rel.length) {
            await conn.rollback();
            return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
        }

        const { tenant_id, tenant_user_id, subject } = rel[0];
        const notifTitle = "Maintenance Request Update";
        const notifBody = `Your maintenance request "${subject}" has been updated to "${status}".`;
        const notifUrl = `/pages/tenant/maintenance/view/${request_id}`;

        // 4️⃣ Save Notification
        await conn.query(
            `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [tenant_user_id, notifTitle, notifBody, notifUrl]
        );

        // 5️⃣ Push Notification
        const [subs]: any = await conn.query(
            `SELECT endpoint, p256dh, auth
       FROM user_push_subscriptions
       WHERE user_id = ?`,
            [tenant_user_id]
        );

        if (subs.length > 0) {
            const payload = JSON.stringify({ title: notifTitle, body: notifBody, url: notifUrl });

            for (const sub of subs) {
                const subscription = {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                };

                try {
                    await webpush.sendNotification(subscription, payload);
                    console.log("✅ Push sent to tenant:", sub.endpoint);
                } catch (err: any) {
                    console.error("❌ Push failed:", err.message);
                    // Clean up invalid subscriptions
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await conn.query(`DELETE FROM user_push_subscriptions WHERE endpoint = ?`, [
                            sub.endpoint,
                        ]);
                        console.log("🗑️ Removed invalid subscription:", sub.endpoint);
                    }
                }
            }
        }

        // 6️⃣ Emit Socket message
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
            autoConnect: true,
            transports: ["websocket"],
        });
        const chat_room = `chat_${[tenant_user_id, landlordUserId].sort().join("_")}`;
        socket.emit("sendMessage", {
            sender_id: landlordUserId,
            sender_type: "landlord",
            receiver_id: tenant_id,
            receiver_type: "tenant",
            message: notifBody,
            chat_room,
        });
        setTimeout(() => socket.disconnect(), 400);

        // 7️⃣ Log Activity (tenant + landlord)
        const [newRows]: any = await conn.query(
            `SELECT * FROM MaintenanceRequest WHERE request_id = ?`,
            [request_id]
        );

        const newData = newRows[0];
        const oldData = oldRows[0];

        // Tenant Log
        await conn.query(
            `INSERT INTO ActivityLog
             (user_id, action, description, target_table, target_id, old_value, new_value,
              endpoint, http_method, status_code, ip_address, user_agent, device_type, session_id, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
                tenant_user_id,
                "Maintenance Request Updated",
                `Maintenance request "${subject}" updated to "${status}" by landlord.`,
                "MaintenanceRequest",
                String(request_id),
                JSON.stringify(oldData),
                JSON.stringify(newData),
                endpoint,
                method,
                200,
                ip,
                userAgent,
                deviceType,
                sessionId,
            ]
        );

        // Landlord Log
        await conn.query(
            `INSERT INTO ActivityLog 
       (user_id, action, description, target_table, target_id, old_value, new_value,
        endpoint, http_method, status_code, ip_address, user_agent, device_type, session_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
                landlordUserId,
                "Updated Tenant Maintenance Status",
                `Landlord updated maintenance request "${subject}" to "${status}".`,
                "MaintenanceRequest",
                String(request_id),
                JSON.stringify(oldData),
                JSON.stringify(newData),
                endpoint,
                method,
                200,
                ip,
                userAgent,
                deviceType,
                sessionId,
            ]
        );

        await conn.commit();

        return NextResponse.json({
            success: true,
            message:
                "Maintenance request updated, tenant notified (Socket + Push), and activity logs recorded.",
        });
    } catch (error: any) {
        console.error("Maintenance update error:", error);
        await conn.rollback();
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        conn.release();
    }
}
