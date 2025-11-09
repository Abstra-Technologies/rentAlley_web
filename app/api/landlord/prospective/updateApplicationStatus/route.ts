import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { generateLeaseId } from "@/utils/id_generator";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function PUT(req: NextRequest) {
    let connection;
    try {
        const { unitId, status, message, tenant_id } = await req.json();

        // 🧩 Validate status input
        const validStatuses = ["pending", "approved", "disapproved"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
        }

        if (status === "disapproved" && (!message || message.trim() === "")) {
            return NextResponse.json(
                { message: "Disapproval message is required" },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        // 🧩 Get tenant user_id
        const [tenantResult]: any = await connection.query(
            "SELECT user_id FROM Tenant WHERE tenant_id = ?",
            [tenant_id]
        );
        if (!tenantResult.length) {
            return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
        }
        const user_id = tenantResult[0].user_id;

        // 🧩 Fetch property/unit details
        const [unitDetails]: any = await connection.query(
            `
      SELECT 
        u.unit_name, 
        u.status AS current_status,
        p.property_name,
        p.property_id
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      WHERE u.unit_id = ?
      `,
            [unitId]
        );

        const propertyName = unitDetails?.[0]?.property_name || "Unknown Property";
        const unitName = unitDetails?.[0]?.unit_name || "Unknown Unit";
        const propertyId = unitDetails?.[0]?.property_id || null;
        const currentStatus = unitDetails?.[0]?.current_status || "unoccupied";

        // 🧩 Update ProspectiveTenant
        await connection.query(
            `
      UPDATE ProspectiveTenant
      SET status = ?, message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE unit_id = ? AND tenant_id = ?
      `,
            [status, message || null, unitId, tenant_id]
        );

        // Initialize notification content
        let title = "Tenant Application Update";
        let bodyMessage = "Your tenant application status has been updated.";
        let redirectUrl = "/pages/tenant/myApplications";

        // 🔹 Handle status-specific logic
        if (status === "approved") {
            title = "🎉 Application Approved!";
            bodyMessage = `
        Congratulations! Your application for <b>${propertyName}</b> - <b>${unitName}</b> has been <b>approved</b>.<br/>
        You can now proceed to confirm and review your lease agreement in your dashboard.
      `;

            // 🟩 Check for existing lease
            const [existingLease]: any = await connection.query(
                `
        SELECT agreement_id 
        FROM LeaseAgreement 
        WHERE tenant_id = ? AND unit_id = ? 
        LIMIT 1
        `,
                [tenant_id, unitId]
            );

            // 🆕 Create lease draft if none exists
            if (!existingLease.length) {
                let lease_id = generateLeaseId();
                let isUnique = false;

                while (!isUnique) {
                    const [exists]: any = await connection.query(
                        `SELECT 1 FROM LeaseAgreement WHERE agreement_id = ? LIMIT 1`,
                        [lease_id]
                    );
                    if (!exists.length) isUnique = true;
                    else lease_id = generateLeaseId();
                }

                await connection.query(
                    `
          INSERT INTO LeaseAgreement (
            agreement_id, tenant_id, unit_id, start_date, end_date, status, created_at
          )
          VALUES (?, ?, ?, NULL, NULL, 'draft', CURRENT_TIMESTAMP)
          `,
                    [lease_id, tenant_id, unitId]
                );
            } else {
                // If it already exists, ensure it's still draft
                await connection.query(
                    `
          UPDATE LeaseAgreement 
          SET status = 'draft', updated_at = CURRENT_TIMESTAMP
          WHERE tenant_id = ? AND unit_id = ? AND status NOT IN ('active', 'cancelled')
          `,
                    [tenant_id, unitId]
                );
            }

            // ✅ Update Unit → Reserved (only if not already occupied)
            if (currentStatus !== "occupied") {
                await connection.query(
                    `
          UPDATE Unit
          SET status = 'reserved', updated_at = CURRENT_TIMESTAMP
          WHERE unit_id = ?
          `,
                    [unitId]
                );
            }
        }

        // 🟥 Disapproved logic
        else if (status === "disapproved") {
            title = "❌ Application Disapproved";
            bodyMessage = `
        Unfortunately, your application for <b>${propertyName}</b> - <b>${unitName}</b> was <b>disapproved</b>.<br/>
        <b>Reason:</b> ${message}.
      `;

            // 🔹 Return the unit to available
            await connection.query(
                `
        UPDATE Unit
        SET status = 'unoccupied', updated_at = CURRENT_TIMESTAMP
        WHERE unit_id = ?
        `,
                [unitId]
            );
        }

        // 🟨 Pending logic
        else if (status === "pending") {
            title = "🕓 Application Under Review";
            bodyMessage = `
        Your application for <b>${propertyName}</b> - <b>${unitName}</b> is still <b>under review</b> by the landlord.
      `;

            // 🔹 Keep unit available for others to apply
            await connection.query(
                `
        UPDATE Unit
        SET status = 'unoccupied', updated_at = CURRENT_TIMESTAMP
        WHERE unit_id = ?
        `,
                [unitId]
            );
        }

        // 🧩 Insert notification
        await connection.query(
            `
      INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `,
            [user_id, title, bodyMessage, redirectUrl]
        );

        // 🧩 Web Push Notifications
        const [subs]: any = await connection.query(
            `
      SELECT endpoint, p256dh, auth
      FROM user_push_subscriptions
      WHERE user_id = ?
      `,
            [user_id]
        );

        if (subs.length > 0) {
            const payload = JSON.stringify({
                title,
                body: bodyMessage.replace(/<[^>]*>/g, ""), // plain text fallback
                url: redirectUrl,
                icon: `${process.env.NEXT_PUBLIC_BASE_URL}/icons/notification-icon.png`,
            });

            for (const sub of subs) {
                const subscription = {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                };
                try {
                    await webpush.sendNotification(subscription, payload);
                } catch (err: any) {
                    console.warn("❌ Web Push failed:", err?.message || err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await connection.query(
                            `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                            [sub.endpoint]
                        );
                    }
                }
            }
        }

        return NextResponse.json(
            { message: `Tenant application ${status} successfully updated.` },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Error updating tenant status:", error);
        return NextResponse.json(
            { message: "Server Error", error: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
