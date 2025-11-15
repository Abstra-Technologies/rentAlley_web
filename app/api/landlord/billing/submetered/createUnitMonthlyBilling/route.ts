import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBillId } from "@/utils/id_generator";
import type { RowDataPacket } from "mysql2";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import webpush from "web-push";
import { io } from "socket.io-client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails("mailto:support@upkyp.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export const runtime = "nodejs";

/* -----------------------------------------------------
    HELPERS
----------------------------------------------------- */

function detectDevice(ua: string) {
  const agent = ua.toLowerCase();
  if (agent.includes("mobile")) return "mobile";
  if (agent.includes("tablet") || agent.includes("ipad")) return "tablet";
  return "web";
}

/* -----------------------------------------------------
   ⭐  MAIN UPSERT FUNCTION
----------------------------------------------------- */

async function upsertBilling(req: NextRequest) {
  const connection = await db.getConnection();

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const deviceType = detectDevice(userAgent);
    const endpoint = req.url;
    const method = req.method;

    /* ---------- AUTH ---------- */
    const cookieHeader = req.headers.get("cookie");
    const cookies = cookieHeader ? parse(cookieHeader) : null;
    if (!cookies?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(cookies.token, secret as any);
    const landlordUserId = payload.user_id;
    const sessionId = payload.session_id || payload.jti || null;

    const {
      unit_id,
      billingDate, // ⭐ Billing Period
      readingDate,
      dueDate,
      waterPrevReading,
      waterCurrentReading,
      electricityPrevReading,
      electricityCurrentReading,
      totalWaterAmount,
      totalElectricityAmount,
      total_amount_due,
      additionalCharges = [],
    } = await req.json();

    if (!unit_id || !billingDate || !readingDate || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields (unit_id, billingDate, readingDate, dueDate)" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    /* -----------------------------------------------------
       1️⃣ UNIT + PROPERTY
    ----------------------------------------------------- */
    const [unitRows]: any = await connection.query(
      `
        SELECT unit_id, property_id
        FROM Unit
        WHERE unit_id = ?
        LIMIT 1
      `,
      [unit_id]
    );

    if (unitRows.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const property_id = unitRows[0].property_id;

    /* -----------------------------------------------------
       2️⃣ GET LATEST CONCESSIONAIRE BILLING CYCLE
    ----------------------------------------------------- */
    const [conRows]: any = await connection.query(
      `
        SELECT bill_id, period_start, period_end
        FROM ConcessionaireBilling
        WHERE property_id = ?
        ORDER BY period_end DESC
        LIMIT 1
      `,
      [property_id]
    );

    if (conRows.length === 0) {
      return NextResponse.json(
        { error: "No concessionaire billing set for this property." },
        { status: 400 }
      );
    }

    const concessionaire_bill_id = conRows[0].bill_id;
    const period_start = conRows[0].period_start;
    const period_end = conRows[0].period_end;

    /* -----------------------------------------------------
       3️⃣ GET ACTIVE LEASE (AND TENANT)
    ----------------------------------------------------- */
    const [leaseRows]: any = await connection.query(
      `
        SELECT la.agreement_id, la.tenant_id, t.user_id AS tenant_user_id
        FROM LeaseAgreement la
        JOIN Tenant t ON la.tenant_id = t.tenant_id
        WHERE la.unit_id = ?
          AND la.status IN ('active')
        ORDER BY la.created_at DESC
        LIMIT 1
      `,
      [unit_id]
    );

    if (!leaseRows.length) {
      await connection.rollback();
      return NextResponse.json({ error: "No valid lease found." }, { status: 404 });
    }

    const lease_id = leaseRows[0].agreement_id;
    const tenant_id = leaseRows[0].tenant_id;
    const tenant_user_id = leaseRows[0].tenant_user_id;

    /* -----------------------------------------------------
        UPSERT BILLING (USING billingDate)
    ----------------------------------------------------- */
    const [existing]: any = await connection.query(
      `
        SELECT billing_id 
        FROM Billing
        WHERE unit_id = ?
          AND billing_period = ?
        LIMIT 1
      `,
      [unit_id, billingDate]
    );

    let billing_id;
    const isUpdate = existing.length > 0;

    if (isUpdate) {
      billing_id = existing[0].billing_id;

      await connection.query(
        `
          UPDATE Billing
          SET total_water_amount = ?,
              total_electricity_amount = ?,
              total_amount_due = ?,
              due_date = ?,
              status = 'unpaid',
              updated_at = NOW()
          WHERE billing_id = ?
        `,
        [
          totalWaterAmount || 0,
          totalElectricityAmount || 0,
          total_amount_due || 0,
          dueDate,
          billing_id,
        ]
      );
    } else {
      billing_id = generateBillId();

      await connection.query(
        `
          INSERT INTO Billing (
            billing_id, lease_id, unit_id,
            billing_period,
            total_water_amount, total_electricity_amount,
            total_amount_due, due_date, status, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', NOW())
        `,
        [
          billing_id,
          lease_id,
          unit_id,
          billingDate,
          totalWaterAmount || 0,
          totalElectricityAmount || 0,
          total_amount_due || 0,
          dueDate,
        ]
      );
    }

    /* -----------------------------------------------------
        UPSERT WATER READING (LATEST CYCLE)
    ----------------------------------------------------- */
    if (waterPrevReading !== "" && waterCurrentReading !== "") {
      const [w]: any = await connection.query(
        `
          SELECT reading_id 
          FROM WaterMeterReading
          WHERE unit_id = ?
            AND concessionaire_bill_id = ?
          LIMIT 1
        `,
        [unit_id, concessionaire_bill_id]
      );

      if (w.length > 0) {
        await connection.query(
          `
            UPDATE WaterMeterReading
            SET previous_reading = ?, 
                current_reading = ?, 
                reading_date = ?
            WHERE reading_id = ?
          `,
          [waterPrevReading, waterCurrentReading, readingDate, w[0].reading_id]
        );
      } else {
        await connection.query(
          `
            INSERT INTO WaterMeterReading
              (unit_id, period_start, period_end,
               reading_date, previous_reading, current_reading,
               concessionaire_bill_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            unit_id,
            period_start,
            period_end,
            readingDate,
            waterPrevReading,
            waterCurrentReading,
            concessionaire_bill_id,
          ]
        );
      }
    }

    /* -----------------------------------------------------
        6️⃣ UPSERT ELECTRIC READING (LATEST CYCLE)
    ----------------------------------------------------- */
    if (electricityPrevReading !== "" && electricityCurrentReading !== "") {
      const [e]: any = await connection.query(
        `
          SELECT reading_id 
          FROM ElectricMeterReading
          WHERE unit_id = ?
            AND concessionaire_bill_id = ?
          LIMIT 1
        `,
        [unit_id, concessionaire_bill_id]
      );

      if (e.length > 0) {
        await connection.query(
          `
            UPDATE ElectricMeterReading
            SET previous_reading = ?, 
                current_reading = ?, 
                reading_date = ?
            WHERE reading_id = ?
          `,
          [electricityPrevReading, electricityCurrentReading, readingDate, e[0].reading_id]
        );
      } else {
        await connection.query(
          `
            INSERT INTO ElectricMeterReading
              (unit_id, period_start, period_end,
               reading_date, previous_reading, current_reading,
               concessionaire_bill_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            unit_id,
            period_start,
            period_end,
            readingDate,
            electricityPrevReading,
            electricityCurrentReading,
            concessionaire_bill_id,
          ]
        );
      }
    }

    /* -----------------------------------------------------
        7️⃣ REPLACE ADDITIONAL & DISCOUNT CHARGES
    ----------------------------------------------------- */
    await connection.query(
      `DELETE FROM BillingAdditionalCharge WHERE billing_id = ?`,
      [billing_id]
    );

    for (const c of additionalCharges) {
      await connection.query(
        `
          INSERT INTO BillingAdditionalCharge
            (billing_id, charge_category, charge_type, amount)
          VALUES (?, ?, ?, ?)
        `,
        [
          billing_id,
          c.charge_category,
          c.charge_type.trim(),
          Number(c.amount),
        ]
      );
    }

    /* -----------------------------------------------------
       PUSH NOTIFICATION TO TENANT
    ----------------------------------------------------- */

    const notifTitle = "Statement of Account Ready";
    const notifBody = `Your billing for this period is now ready to view.`;
    const notifUrl = `/pages/tenant/billing`;

    await connection.query(
      `
        INSERT INTO Notification (user_id, title, body, url, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `,
      [tenant_user_id, notifTitle, notifBody, notifUrl]
    );

    // Send Web Push
    const [subs]: any = await connection.query(
      `SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?`,
      [tenant_user_id]
    );

    if (subs.length > 0) {
      const payload = JSON.stringify({
        title: notifTitle,
        body: notifBody,
        url: notifUrl,
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await connection.query(
              `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
              [sub.endpoint]
            );
          }
        }
      }
    }

    /* -----------------------------------------------------
        9️⃣ SOCKET MESSAGE
    ----------------------------------------------------- */

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
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

    /* -----------------------------------------------------
        🔟 ACTIVITY LOGS
    ----------------------------------------------------- */

    const actionLabel = "Billing Created";
    const desc = `Billing for unit ${unit_id} is ready.`;


    // Tenant Log
    await connection.query(
      `
        INSERT INTO ActivityLog
          (user_id, action, description, target_table, target_id,
           old_value, new_value, endpoint, http_method, status_code,
           ip_address, user_agent, device_type, session_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        tenant_user_id,
        actionLabel,
        desc,
        "Billing",
        String(billing_id),
        null,
        JSON.stringify({ billing_id }),
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
    await connection.query(
      `
        INSERT INTO ActivityLog
          (user_id, action, description, target_table, target_id,
           old_value, new_value, endpoint, http_method, status_code,
           ip_address, user_agent, device_type, session_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        landlordUserId,
        actionLabel,
        desc,
        "Billing",
        String(billing_id),
        null,
        JSON.stringify({ billing_id }),
        endpoint,
        method,
        200,
        ip,
        userAgent,
        deviceType,
        sessionId,
      ]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        billing_id,
        message: isUpdate ? "Billing updated." : "Billing created.",
      },
      { status: isUpdate ? 200 : 201 }
    );

  } catch (error: any) {
    await connection.rollback();
    console.error("❌ Billing error:", error);
    return NextResponse.json(
      { error: "Billing failed", details: error.message },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function POST(req: NextRequest) {
  return upsertBilling(req);
}
export async function PUT(req: NextRequest) {
  return upsertBilling(req);
}
