import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBillId } from "@/utils/id_generator";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

/* =====================================================
   HELPERS
===================================================== */

function ymd(d: Date | string) {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
        x.getDate()
    ).padStart(2, "0")}`;
}

function normalizeBillingPeriod(date: string) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthRange(date: string) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start: ymd(start), end: ymd(end) };
}

async function auth(req: NextRequest) {
    const cookies = req.headers.get("cookie")
        ? parse(req.headers.get("cookie")!)
        : null;

    if (!cookies?.token) throw new Error("Unauthorized");

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(cookies.token, secret as any);
}

/* =====================================================
   CREATE BILLING (POST)
===================================================== */

async function createBilling(req: NextRequest) {
    const conn = await db.getConnection();

    try {
        await auth(req);

        const body = await req.json();
        const {
            unit_id,
            billingDate,
            readingDate,
            dueDate,
            waterPrevReading,
            waterCurrentReading,
            electricityPrevReading,
            electricityCurrentReading,
            totalWaterAmount = 0,
            totalElectricityAmount = 0,
            total_amount_due = 0,
            additionalCharges = [],
        } = body;

        if (!unit_id || !billingDate || !readingDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const billingPeriod = normalizeBillingPeriod(billingDate);
        const { start: periodStart, end: periodEnd } = monthRange(readingDate);

        await conn.beginTransaction();

        /* ---------- PREVENT DUPLICATE BILL ---------- */
        const [[existing]]: any = await conn.query(
            `SELECT billing_id FROM Billing WHERE unit_id = ? AND billing_period = ?`,
            [unit_id, billingPeriod]
        );

        if (existing) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Billing already exists for this month" },
                { status: 409 }
            );
        }

        /* ---------- ACTIVE LEASE ---------- */
        const [[lease]]: any = await conn.query(
            `
      SELECT agreement_id
      FROM LeaseAgreement
      WHERE unit_id = ?
        AND status = 'active'
      LIMIT 1
      `,
            [unit_id]
        );

        if (!lease) {
            await conn.rollback();
            return NextResponse.json(
                { error: "No active lease" },
                { status: 404 }
            );
        }

        const billing_id = generateBillId();

        /* ---------- INSERT BILLING ---------- */
        await conn.query(
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
      `,
            [
                billing_id,
                lease.agreement_id,
                unit_id,
                billingPeriod,
                totalWaterAmount,
                totalElectricityAmount,
                total_amount_due,
                dueDate,
            ]
        );

        /* ---------- WATER METER ---------- */
        if (waterPrevReading != null && waterCurrentReading != null) {
            await conn.query(
                `
        INSERT INTO WaterMeterReading
          (unit_id, period_start, period_end, reading_date,
           previous_reading, current_reading)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          previous_reading = VALUES(previous_reading),
          current_reading  = VALUES(current_reading),
          reading_date     = VALUES(reading_date),
          updated_at       = NOW()
        `,
                [
                    unit_id,
                    periodStart,
                    periodEnd,
                    readingDate,
                    Number(waterPrevReading),
                    Number(waterCurrentReading),
                ]
            );
        }

        /* ---------- ELECTRIC METER ---------- */
        if (electricityPrevReading != null && electricityCurrentReading != null) {
            await conn.query(
                `
        INSERT INTO ElectricMeterReading
          (unit_id, period_start, period_end, reading_date,
           previous_reading, current_reading)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          previous_reading = VALUES(previous_reading),
          current_reading  = VALUES(current_reading),
          reading_date     = VALUES(reading_date),
          updated_at       = NOW()
        `,
                [
                    unit_id,
                    periodStart,
                    periodEnd,
                    readingDate,
                    Number(electricityPrevReading),
                    Number(electricityCurrentReading),
                ]
            );
        }

        /* ---------- CHARGES ---------- */
        for (const c of additionalCharges) {
            await conn.query(
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

        await conn.commit();

        return NextResponse.json(
            { success: true, billing_id },
            { status: 201 }
        );
    } catch (err: any) {
        await conn.rollback();
        console.error("CREATE BILLING ERROR:", err);
        return NextResponse.json(
            { error: err.message || "Create billing failed" },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}

/* =====================================================
   UPDATE BILLING (PUT)
===================================================== */

async function updateBilling(req: NextRequest) {
    const conn = await db.getConnection();

    const log = (...args: any[]) =>
        console.log("[UPDATE BILLING]", ...args);

    try {
        await auth(req);

        const body = await req.json();
        const {
            billing_id,
            unit_id,
            readingDate,
            dueDate,
            waterPrevReading,
            waterCurrentReading,
            electricityPrevReading,
            electricityCurrentReading,
            totalWaterAmount = 0,
            totalElectricityAmount = 0,
            total_amount_due = 0,
            additionalCharges = [],
        } = body;

        log("Request body:", body);

        if (!billing_id || !unit_id || !readingDate) {
            log("❌ Missing required fields");
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const { start: periodStart, end: periodEnd } = monthRange(readingDate);

        log("Computed period:", { periodStart, periodEnd });

        await conn.beginTransaction();
        log("Transaction started");

        /* ---------- UPDATE BILLING ---------- */
        const [res]: any = await conn.query(
            `
            UPDATE Billing
            SET
              total_water_amount = ?,
              total_electricity_amount = ?,
              total_amount_due = ?,
              due_date = ?,
              updated_at = NOW()
            WHERE billing_id = ?
            `,
            [
                totalWaterAmount,
                totalElectricityAmount,
                total_amount_due,
                dueDate,
                billing_id,
            ]
        );

        log("Billing update affectedRows:", res.affectedRows);

        if (res.affectedRows === 0) {
            log("❌ Billing not found");
            await conn.rollback();
            return NextResponse.json(
                { error: "Billing not found" },
                { status: 404 }
            );
        }

        /* ---------- WATER METER ---------- */
        if (waterPrevReading != null && waterCurrentReading != null) {
            log("Updating WATER meter");

            const [waterRes]: any = await conn.query(
                `
                UPDATE WaterMeterReading
                SET
                  previous_reading = ?,
                  current_reading  = ?,
                  reading_date     = ?,
                  updated_at       = NOW()
                WHERE unit_id = ?
                  AND period_start = ?
                  AND period_end   = ?
                `,
                [
                    Number(waterPrevReading),
                    Number(waterCurrentReading),
                    readingDate,
                    unit_id,
                    periodStart,
                    periodEnd,
                ]
            );

            log("Water update affectedRows:", waterRes.affectedRows);

            if (waterRes.affectedRows === 0) {
                log("⚠️ No WATER record found → inserting");

                await conn.query(
                    `
                    INSERT INTO WaterMeterReading
                      (unit_id, period_start, period_end, reading_date,
                       previous_reading, current_reading)
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        unit_id,
                        periodStart,
                        periodEnd,
                        readingDate,
                        Number(waterPrevReading),
                        Number(waterCurrentReading),
                    ]
                );

                log("✅ Water meter inserted");
            }
        }

        /* ---------- ELECTRIC METER ---------- */
        if (electricityPrevReading != null && electricityCurrentReading != null) {
            log("Updating ELECTRIC meter");

            const [elecRes]: any = await conn.query(
                `
                UPDATE ElectricMeterReading
                SET
                  previous_reading = ?,
                  current_reading  = ?,
                  reading_date     = ?,
                  updated_at       = NOW()
                WHERE unit_id = ?
                  AND period_start = ?
                  AND period_end   = ?
                `,
                [
                    Number(electricityPrevReading),
                    Number(electricityCurrentReading),
                    readingDate,
                    unit_id,
                    periodStart,
                    periodEnd,
                ]
            );

            log("Electric update affectedRows:", elecRes.affectedRows);

            if (elecRes.affectedRows === 0) {
                log("⚠️ No ELECTRIC record found → inserting");

                await conn.query(
                    `
                    INSERT INTO ElectricMeterReading
                      (unit_id, period_start, period_end, reading_date,
                       previous_reading, current_reading)
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        unit_id,
                        periodStart,
                        periodEnd,
                        readingDate,
                        Number(electricityPrevReading),
                        Number(electricityCurrentReading),
                    ]
                );

                log("✅ Electric meter inserted");
            }
        }

        /* ---------- RESET CHARGES ---------- */
        log("Resetting additional charges");

        await conn.query(
            `DELETE FROM BillingAdditionalCharge WHERE billing_id = ?`,
            [billing_id]
        );

        for (const c of additionalCharges) {
            await conn.query(
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

        await conn.commit();
        log("✅ Transaction committed");

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err: any) {
        await conn.rollback();
        console.error("❌ UPDATE BILLING ERROR:", err);

        return NextResponse.json(
            { error: err.message || "Update billing failed" },
            { status: 500 }
        );
    } finally {
        conn.release();
        log("Connection released");
    }
}

/* =====================================================
   ROUTE EXPORTS
===================================================== */

export async function POST(req: NextRequest) {
    return createBilling(req);
}

export async function PUT(req: NextRequest) {
    return updateBilling(req);
}
