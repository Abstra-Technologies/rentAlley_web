import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:upkyp-notify@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const body = await req.json();
        const {
            unit_id,
            start_date,
            end_date,
            security_deposit_amount = 0,
            advance_payment_amount = 0,
        } = body;

        if (!unit_id || !start_date || !end_date) {
            return NextResponse.json(
                { error: "Unit ID, start date, and end date are required" },
                { status: 400 }
            );
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (endDate <= startDate) {
            return NextResponse.json(
                { error: "End date must be after start date" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // ✅ Step 1: Determine tenant_id
        let tenant_id: string | null = null;
        const [leaseRows]: any = await connection.execute(
            `
        SELECT tenant_id
        FROM LeaseAgreement
        WHERE unit_id = ?
          AND status IN ('pending', 'sent', 'draft')
        LIMIT 1
      `,
            [unit_id]
        );

        if (leaseRows.length > 0) {
            tenant_id = leaseRows[0].tenant_id;
        } else {
            const [prospectiveRows]: any = await connection.execute(
                `
          SELECT tenant_id
          FROM ProspectiveTenant
          WHERE unit_id = ?
            AND status = 'approved'
          LIMIT 1
        `,
                [unit_id]
            );
            if (prospectiveRows.length === 0) {
                return NextResponse.json(
                    { error: "No pending lease or approved tenant found" },
                    { status: 404 }
                );
            }
            tenant_id = prospectiveRows[0].tenant_id;
        }

        // ✅ Step 2: Update or Insert LeaseAgreement
        const [updateResult]: any = await connection.execute(
            `
        UPDATE LeaseAgreement
        SET 
          start_date = ?,
          end_date = ?,
          status = 'active',
          agreement_url = agreement_url,
          is_security_deposit_paid = 1,
          is_advance_payment_paid = 1,
          security_deposit_amount = ?,
          advance_payment_amount = ?,
          grace_period_days = 3
        WHERE unit_id = ? AND tenant_id = ?
      `,
            [
                start_date,
                end_date,
                security_deposit_amount,
                advance_payment_amount,
                unit_id,
                tenant_id,
            ]
        );

        if (updateResult.affectedRows === 0) {
            await connection.execute(
                `
          INSERT INTO LeaseAgreement (
            tenant_id,
            unit_id,
            start_date,
            end_date,
            status,
            agreement_url,
            is_security_deposit_paid,
            is_advance_payment_paid,
            security_deposit_amount,
            advance_payment_amount,
            grace_period_days
          )
          VALUES (?, ?, ?, ?, 'active', NULL, 1, 1, ?, ?, 3)
        `,
                [
                    tenant_id,
                    unit_id,
                    start_date,
                    end_date,
                    security_deposit_amount,
                    advance_payment_amount,
                ]
            );
        }

        // ✅ Step 3: Mark unit as occupied
        await connection.execute(
            `UPDATE Unit SET status = 'occupied' WHERE unit_id = ?`,
            [unit_id]
        );

        // ✅ Step 4: Notify tenant
        const [tenantRow]: any = await connection.execute(
            `
                SELECT u.user_id, u.firstName, u.lastName, p.property_name, un.unit_name
                FROM Tenant t
                         JOIN User u ON t.user_id = u.user_id
                         JOIN LeaseAgreement la ON la.tenant_id = t.tenant_id
                         JOIN Unit un ON la.unit_id = un.unit_id
                         JOIN Property p ON un.property_id = p.property_id
                WHERE t.tenant_id = ?
                LIMIT 1
            `,
            [tenant_id]
        );


        const user_id = tenantRow?.[0]?.user_id;
        const tenantName = `${tenantRow?.[0]?.firstName || ""} ${
            tenantRow?.[0]?.lastName || ""
        }`.trim();
        const propertyName = tenantRow?.[0]?.property_name || "Property";
        const unitName = tenantRow?.[0]?.unit_name || "Unit";

        const notificationBody = `🏠 Your lease for ${propertyName} - ${unitName} has been activated. Lease period: ${start_date} to ${end_date}.`;

        // Save notification in DB
        await connection.execute(
            `
        INSERT INTO Notification (user_id, title, body, is_read, created_at)
        VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
      `,
            [user_id, "Lease Activated", notificationBody]
        );

        // ✅ Send web push
        const [subs]: any = await connection.execute(
            `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
            [user_id]
        );

        if (subs.length > 0) {
            const payload = JSON.stringify({
                title: "Lease Activated",
                body: notificationBody,
                url: "/pages/tenant/activeLease",
            });

            for (const sub of subs) {
                const subscription = {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                };

                try {
                    await webpush.sendNotification(subscription, payload);
                } catch (err: any) {
                    console.error("Push notification failed:", err);
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        await connection.execute(
                            `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
                            [sub.endpoint]
                        );
                    }
                }
            }
        }

        await connection.commit();

        return NextResponse.json(
            {
                message:
                    "Lease updated successfully and tenant notified (marked as active).",
                start_date,
                end_date,
                security_deposit_amount,
                advance_payment_amount,
            },
            { status: 200 }
        );
    } catch (error: any) {
        await connection.rollback();
        console.error("Error updating lease:", error);
        return NextResponse.json(
            { error: "Failed to update lease", details: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
