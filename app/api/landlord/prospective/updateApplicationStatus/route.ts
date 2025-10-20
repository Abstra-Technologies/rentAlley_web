import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// 🔑 Web Push keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

// Configure web-push
webpush.setVapidDetails(
    "mailto:your-email@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function PUT(req: NextRequest) {
  try {
    const { unitId, status, message, tenant_id } = await req.json();

    console.log('application status:', status);
    console.log('unit id:', unitId);

    if (!["pending", "approved", "disapproved"].includes(status)) {
      return NextResponse.json(
          { message: "Invalid status value" },
          { status: 400 }
      );
    }

    if (status === "disapproved" && (!message || message.trim() === "")) {
      return NextResponse.json(
          { message: "Disapproval message is required" },
          { status: 400 }
      );
    }

    // 📌 Fetch user_id from Tenant table
    const [tenantResult] = await db.query(
        "SELECT user_id FROM Tenant WHERE tenant_id = ?",
        [tenant_id]
    );

    // @ts-ignore
    if (!tenantResult || tenantResult.length === 0) {
      return NextResponse.json(
          { message: "Tenant not found" },
          { status: 404 }
      );
    }

    // @ts-ignore
    const user_id = tenantResult[0].user_id;

    // 📌 Fetch property & unit details
    const [unitDetails]: any = await db.query(
        `SELECT u.unit_name, p.property_name
       FROM Unit u
       JOIN Property p ON u.property_id = p.property_id
       WHERE u.unit_id = ?`,
        [unitId]
    );

    const propertyName = unitDetails?.[0]?.property_name || "Unknown Property";
    const unitName = unitDetails?.[0]?.unit_name || "Unknown Unit";

    // 📌 Update status and optional message
    await db.query(
        `UPDATE ProspectiveTenant
         SET status = ?, message = ?, updated_at = CURRENT_TIMESTAMP
         WHERE unit_id = ? AND tenant_id = ?`,
        [status, message || null, unitId, tenant_id]
    );

    // 📌 Build notification
    let notificationMessage = "Your tenant application status has been updated.";
    if (status === "approved") {
      notificationMessage = `🎉 Your unit (${propertyName} - ${unitName}) has been approved!`;
    } else if (status === "disapproved") {
      notificationMessage = `❌ Your unit (${propertyName} - ${unitName}) application was disapproved. Reason: ${message}`;
    }

    // Save notification in DB
    await db.query(
        `INSERT INTO Notification (user_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [user_id, "Tenant Application Update", notificationMessage]
    );

    // 📌 Fetch push subscriptions
    const [subs]: any = await db.query(
        `SELECT endpoint, p256dh, auth
         FROM user_push_subscriptions
         WHERE user_id = ?`,
        [user_id]
    );

    if (subs.length > 0) {
      const payload = JSON.stringify({
        title: "Application Update",
        body: notificationMessage,
        url: "/pages/tenant/myApplications",
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

          // Remove invalid subscriptions
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

    return NextResponse.json(
        { message: `Tenant application ${status} successfully!` },
        { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating tenant status:", error);
    return NextResponse.json(
        { message: "Server Error", error: error.message },
        { status: 500 }
    );
  }
}
