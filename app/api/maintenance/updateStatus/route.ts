import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import webpush from "web-push";
import { io } from "socket.io-client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
webpush.setVapidDetails("mailto:support@upkyp.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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
        console.log("📦 Incoming update payload:", body);

        const { request_id, status, schedule_date, completion_date, rejection_reason } = body;

        if (!request_id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await conn.beginTransaction();

        // 1️⃣ Fetch existing maintenance request
        const [existingRows]: any = await conn.query(
            `SELECT * FROM MaintenanceRequest WHERE request_id = ?`,
            [request_id]
        );
        if (!existingRows.length) {
            await conn.rollback();
            return NextResponse.json({ error: "Maintenance request not found." }, { status: 404 });
        }
        const oldData = existingRows[0];

        // 2️⃣ Determine next state logic
        let nextStatus = status;

        // ✅ If landlord approves but no schedule yet → mark as "Approved"
        if (status.toLowerCase() === "approved" && !schedule_date) {
            nextStatus = "Approved";
        }

        // ✅ Only allow "Scheduled" when a schedule_date is explicitly provided
        if (status.toLowerCase() === "scheduled" && !schedule_date) {
            return NextResponse.json(
                { error: "Cannot mark as 'Scheduled' without a schedule date." },
                { status: 400 }
            );
        }

        // 3️⃣ Build update query dynamically
        const updateFields = ["status = ?", "updated_at = NOW()"];
        const updateParams: any[] = [nextStatus];

        if (schedule_date) {
            updateFields.push("schedule_date = ?");
            updateParams.push(schedule_date);
        }

        if (completion_date) {
            updateFields.push("completion_date = ?");
            updateParams.push(completion_date);
        }

        if (rejection_reason) {
            updateFields.push("rejection_reason = ?");
            updateParams.push(rejection_reason);
        }

        updateParams.push(request_id);
        const updateQuery = `UPDATE MaintenanceRequest SET ${updateFields.join(", ")} WHERE request_id = ?`;
        await conn.query(updateQuery, updateParams);

        // 4️⃣ Get tenant info
        const [tenantInfo]: any = await conn.query(
            `SELECT mr.tenant_id, t.user_id AS tenant_user_id, mr.subject
       FROM MaintenanceRequest mr
       JOIN Tenant t ON mr.tenant_id = t.tenant_id
       WHERE mr.request_id = ?`,
            [request_id]
        );
        if (!tenantInfo.length) {
            await conn.rollback();
            return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
        }

        const { tenant_id, tenant_user_id, subject } = tenantInfo[0];

        // 5️⃣ Notification setup
        let notifTitle = "Maintenance Request Update";
        let notifBody = `Your maintenance request "${subject}" is now "${nextStatus}".`;

        if (nextStatus.toLowerCase() === "approved") {
            notifBody = `Your maintenance request "${subject}" has been approved by your landlord.`;
        }

        if (nextStatus.toLowerCase() === "rejected" && rejection_reason) {
            notifBody = `Your maintenance request "${subject}" was rejected. Reason: ${rejection_reason}`;
        }

        const notifUrl = `/pages/tenant/maintenance/view/${request_id}`;

        await conn.query(
            `INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [tenant_user_id, notifTitle, notifBody, notifUrl]
        );

        // 6️⃣ Send Push Notification
        const [subs]: any = await conn.query(
            `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
            [tenant_user_id]
        );

        if (subs.length > 0) {
            const payload = JSON.stringify({ title: notifTitle, body: notifBody, url: notifUrl });

            for (const sub of subs) {
                const subscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
                try {
                    await webpush.sendNotification(subscription, payload);
                    console.log("✅ Push sent:", sub.endpoint);
                } catch (err: any) {
                    console.error("❌ Push failed:", err.message);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await conn.query(`DELETE FROM user_push_subscriptions WHERE endpoint = ?`, [sub.endpoint]);
                        console.log("🗑️ Removed invalid subscription:", sub.endpoint);
                    }
                }
            }
        }

        // 7️⃣ Send Socket Message
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

        // 8️⃣ Log Activity
        const [updatedRows]: any = await conn.query(
            `SELECT * FROM MaintenanceRequest WHERE request_id = ?`,
            [request_id]
        );
        const newData = updatedRows[0];

        const actionLabel = `Maintenance Request Updated to ${nextStatus}`;
        const desc = rejection_reason
            ? `Maintenance request "${subject}" was rejected. Reason: ${rejection_reason}`
            : `Maintenance request "${subject}" updated to "${nextStatus}".`;

        // Tenant Log
        await conn.query(
            `INSERT INTO ActivityLog
       (user_id, action, description, target_table, target_id, old_value, new_value,
        endpoint, http_method, status_code, ip_address, user_agent, device_type, session_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
                tenant_user_id,
                actionLabel,
                desc,
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
                actionLabel,
                desc,
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
            message: `Request "${request_id}" successfully updated to "${nextStatus}".`,
            rejection_reason: rejection_reason || null,
        });
    } catch (error: any) {
        console.error("❌ Maintenance update error:", error);
        await conn.rollback();
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        conn.release();
    }
}
