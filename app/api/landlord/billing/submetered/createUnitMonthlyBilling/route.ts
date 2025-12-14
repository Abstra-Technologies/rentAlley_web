import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBillId } from "@/utils/id_generator";
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

/* ------------------ HELPERS ------------------ */

// ✅ Normalize any date → YYYY-MM-01
function normalizeBillingPeriod(date: string) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/* ------------------ UPSERT ------------------ */
async function upsertBilling(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        /* ---------- AUTH ---------- */
        const cookies = req.headers.get("cookie")
            ? parse(req.headers.get("cookie")!)
            : null;

        if (!cookies?.token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secret as any);
        const landlordUserId = payload.user_id;

        /* ---------- BODY ---------- */
        const {
            unit_id,
            billingDate,
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
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // ✅ MONTH-ONLY BILLING PERIOD
        const billingPeriod = normalizeBillingPeriod(billingDate);

        await connection.beginTransaction();

        /* ---------- UNIT ---------- */
        const [[unit]]: any = await connection.query(
            `SELECT unit_id, property_id FROM Unit WHERE unit_id = ? LIMIT 1`,
            [unit_id]
        );

        if (!unit) {
            await connection.rollback();
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        /* ---------- CONCESSIONAIRE ---------- */
        const [[con]]: any = await connection.query(
            `
      SELECT bill_id, period_start, period_end
      FROM ConcessionaireBilling
      WHERE property_id = ?
      ORDER BY period_end DESC
      LIMIT 1
      `,
            [unit.property_id]
        );

        if (!con) {
            await connection.rollback();
            return NextResponse.json(
                { error: "No concessionaire billing set" },
                { status: 400 }
            );
        }

        /* ---------- LEASE ---------- */
        const [[lease]]: any = await connection.query(
            `
      SELECT la.agreement_id, la.tenant_id, t.user_id AS tenant_user_id
      FROM LeaseAgreement la
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      WHERE la.unit_id = ?
        AND la.status = 'active'
      ORDER BY la.created_at DESC
      LIMIT 1
      `,
            [unit_id]
        );

        if (!lease) {
            await connection.rollback();
            return NextResponse.json(
                { error: "No active lease found" },
                { status: 404 }
            );
        }

        /* ---------- BILLING UPSERT (MONTH-SAFE) ---------- */
        const newBillingId = generateBillId();

        await connection.query(
            `
      INSERT INTO Billing (
        billing_id,
        lease_id,
        unit_id,
        billing_period,
        total_water_amount,
        total_electricity_amount,
        total_amount_due,
        due_date,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', NOW())
      ON DUPLICATE KEY UPDATE
        total_water_amount = VALUES(total_water_amount),
        total_electricity_amount = VALUES(total_electricity_amount),
        total_amount_due = VALUES(total_amount_due),
        due_date = VALUES(due_date),
        status = 'unpaid',
        updated_at = NOW()
      `,
            [
                newBillingId,
                lease.agreement_id,
                unit_id,
                billingPeriod, // ✅ MONTH ONLY
                totalWaterAmount || 0,
                totalElectricityAmount || 0,
                total_amount_due || 0,
                dueDate,
            ]
        );

        /* ---------- RESOLVE BILLING ID ---------- */
        const [[billing]]: any = await connection.query(
            `
      SELECT billing_id
      FROM Billing
      WHERE unit_id = ?
        AND billing_period = ?
      LIMIT 1
      `,
            [unit_id, billingPeriod]
        );

        const billing_id = billing.billing_id;

        /* ---------- WATER READING ---------- */
        if (waterPrevReading !== "" && waterCurrentReading !== "") {
            await connection.query(
                `
        INSERT INTO WaterMeterReading
          (unit_id, period_start, period_end, reading_date,
           previous_reading, current_reading, concessionaire_bill_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          previous_reading = VALUES(previous_reading),
          current_reading = VALUES(current_reading),
          reading_date = VALUES(reading_date)
        `,
                [
                    unit_id,
                    con.period_start,
                    con.period_end,
                    readingDate,
                    waterPrevReading,
                    waterCurrentReading,
                    con.bill_id,
                ]
            );
        }

        /* ---------- ELECTRIC READING ---------- */
        if (electricityPrevReading !== "" && electricityCurrentReading !== "") {
            await connection.query(
                `
        INSERT INTO ElectricMeterReading
          (unit_id, period_start, period_end, reading_date,
           previous_reading, current_reading, concessionaire_bill_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          previous_reading = VALUES(previous_reading),
          current_reading = VALUES(current_reading),
          reading_date = VALUES(reading_date)
        `,
                [
                    unit_id,
                    con.period_start,
                    con.period_end,
                    readingDate,
                    electricityPrevReading,
                    electricityCurrentReading,
                    con.bill_id,
                ]
            );
        }

        /* ---------- CHARGES ---------- */
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

        await connection.commit();

        /* ---------- NOTIFICATION ---------- */
        const notifBody = "Your billing for this period is now ready to view.";

        await db.query(
            `
      INSERT INTO Notification
        (user_id, title, body, url, is_read, created_at)
      VALUES (?, 'Statement of Account Ready', ?, '/pages/tenant/billing', 0, NOW())
      `,
            [lease.tenant_user_id, notifBody]
        );

        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
            transports: ["websocket"],
        });

        socket.emit("sendMessage", {
            sender_id: landlordUserId,
            sender_type: "landlord",
            receiver_id: lease.tenant_id,
            receiver_type: "tenant",
            message: notifBody,
        });

        setTimeout(() => socket.disconnect(), 300);

        return NextResponse.json({ success: true, billing_id }, { status: 200 });
    } catch (err: any) {
        await connection.rollback();
        console.error("❌ Billing error:", err);
        return NextResponse.json(
            { error: "Billing failed", details: err.message },
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
