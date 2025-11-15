// app/api/landlord/billing/submetered/getUnitBilling/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/**
 * GET /api/landlord/billing/submetered/getUnitBilling?unit_id=...
 *
 * Returns:
 * {
 *   unit: { ... , effective_rent_amount },
 *   property: { ... },
 *   dueDate: "YYYY-MM-DD",
 *   existingBilling: {
 *     billing_id?,
 *     billing_period,
 *     due_date,
 *     total_amount_due?,
 *     reading_date?,
 *     water_prev?,
 *     water_curr?,
 *     elec_prev?,
 *     elec_curr?,
 *     additional_charges: [],
 *     discounts: []
 *   }
 * }
 *
 * NOTE: This version reads meter readings from:
 *   - WaterMeterReading
 *   - ElectricMeterReading
 *
 * It finds the current-month reading and the previous-month/current-most-recent prior reading,
 * and falls back gracefully if records are missing.
 */

function firstDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function lastDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function ymd(date: Date | string | null) {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unit_id = searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json({ error: "Missing unit_id" }, { status: 400 });
  }

  try {
    // 1) Unit
    const [unitRows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM `Unit` WHERE unit_id = ? LIMIT 1",
      [unit_id]
    );
    if (unitRows.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    const unit = unitRows[0];

    // 2) Property
    const [propRows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM `Property` WHERE property_id = ? LIMIT 1",
      [unit.property_id]
    );
    const property = propRows[0] ?? null;

    // 3) Property configuration (billingDueDay)
    const [configRows] = await db.execute<RowDataPacket[]>(
      "SELECT billingDueDay FROM `PropertyConfiguration` WHERE property_id = ? LIMIT 1",
      [unit.property_id]
    );
    const billingDueDay: number = configRows[0]?.billingDueDay ?? 30;

    // 4) Lease rent lookup (prefer active lease)
    let lease_rent_amount: number | null = null;
    try {
      const [leaseRows] = await db.execute<RowDataPacket[]>(
        `SELECT rent_amount
         FROM LeaseAgreement
         WHERE unit_id = ?
           AND status IN ('active','tenant_signed','landlord_signed')
         LIMIT 1`,
        [unit_id]
      );
      if (leaseRows.length > 0 && leaseRows[0].rent_amount != null) {
        lease_rent_amount = Number(leaseRows[0].rent_amount);
      }
    } catch (e) {
      console.warn("Lease rent lookup failed:", e);
    }
    const effectiveRentAmount =
      lease_rent_amount !== null && !isNaN(lease_rent_amount)
        ? lease_rent_amount
        : Number(unit.rent_amount || 0);

    // Helpers to query new tables
    const getWaterReadingForMonth = async (monthDate: Date) => {
      const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT reading_id, unit_id, reading_date, previous_reading, current_reading
        FROM WaterMeterReading
        WHERE unit_id = ?
          AND DATE_FORMAT(reading_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
        ORDER BY reading_date DESC
        LIMIT 1
      `,
        [unit_id, ymd(monthDate)]
      );
      return rows[0] ?? null;
    };

    const getPrevWaterReading = async (monthDate: Date) => {
      // 1) Try previous month exact
      const [prev] = await db.execute<RowDataPacket[]>(
        `
        SELECT current_reading
        FROM WaterMeterReading
        WHERE unit_id = ?
          AND DATE_FORMAT(reading_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(?, INTERVAL 1 MONTH), '%Y-%m')
        ORDER BY reading_date DESC
        LIMIT 1
      `,
        [unit_id, ymd(monthDate)]
      );
      if (prev.length > 0) return prev[0].current_reading;

      // 2) Fallback: latest reading strictly before current month
      const [before] = await db.execute<RowDataPacket[]>(
        `
        SELECT current_reading
        FROM WaterMeterReading
        WHERE unit_id = ?
          AND reading_date < DATE_FORMAT(?, '%Y-%m-01')
        ORDER BY reading_date DESC
        LIMIT 1
      `,
        [unit_id, ymd(monthDate)]
      );
      return before.length > 0 ? before[0].current_reading : null;
    };

    const getElectricReadingForMonth = async (monthDate: Date) => {
      const [rows] = await db.execute<RowDataPacket[]>(
        `
        SELECT reading_id, unit_id, reading_date, previous_reading, current_reading
        FROM ElectricMeterReading
        WHERE unit_id = ?
          AND DATE_FORMAT(reading_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
        ORDER BY reading_date DESC
        LIMIT 1
      `,
        [unit_id, ymd(monthDate)]
      );
      return rows[0] ?? null;
    };

    const getPrevElectricReading = async (monthDate: Date) => {
      const [prev] = await db.execute<RowDataPacket[]>(
        `
        SELECT current_reading
        FROM ElectricMeterReading
        WHERE unit_id = ?
          AND DATE_FORMAT(reading_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(?, INTERVAL 1 MONTH), '%Y-%m')
        ORDER BY reading_date DESC
        LIMIT 1
      `,
        [unit_id, ymd(monthDate)]
      );
      if (prev.length > 0) return prev[0].current_reading;

      const [before] = await db.execute<RowDataPacket[]>(
        `
        SELECT current_reading
        FROM ElectricMeterReading
        WHERE unit_id = ?
          AND reading_date < DATE_FORMAT(?, '%Y-%m-01')
        ORDER BY reading_date DESC
        LIMIT 1
      `,
        [unit_id, ymd(monthDate)]
      );
      return before.length > 0 ? before[0].current_reading : null;
    };

    // Target is current month
    const today = new Date();
    const monthStart = firstDayOfMonth(today);
    const monthEnd = lastDayOfMonth(today);

    // 5) Billing (existing billing row for this unit & month) — used to populate additional charges / discounts
    const [billingRows] = await db.execute<RowDataPacket[]>(
      `
      SELECT *
      FROM Billing
      WHERE unit_id = ?
        AND billing_period BETWEEN ? AND ?
      LIMIT 1
    `,
      [unit_id, ymd(monthStart), ymd(monthEnd)]
    );

    let additional: any[] = [];
    let discounts: any[] = [];
    let billing_id: number | null = null;
    let billing_period: string | null = null;
    let total_amount_due: number | null = null;

    if (billingRows.length > 0) {
      const billing = billingRows[0];
      billing_id = billing.billing_id;
      billing_period = ymd(billing.billing_period);
      total_amount_due = billing.total_amount_due;

      const [charges] = await db.execute<RowDataPacket[]>(
        `
        SELECT id, charge_category, charge_type, amount
        FROM BillingAdditionalCharge
        WHERE billing_id = ?
      `,
        [billing_id]
      );

      additional = charges.filter((c: any) => c.charge_category === "additional");
      discounts = charges.filter((c: any) => c.charge_category === "discount");
    }

    // 6) Readings from new tables
    const waterCurr = await getWaterReadingForMonth(today);
    const elecCurr = await getElectricReadingForMonth(today);
    const waterPrevValue = await getPrevWaterReading(today);
    const elecPrevValue = await getPrevElectricReading(today);

    const water_prev = waterPrevValue ?? (waterCurr ? waterCurr.previous_reading : null);
    const water_curr = waterCurr ? waterCurr.current_reading : null;

    const elec_prev = elecPrevValue ?? (elecCurr ? elecCurr.previous_reading : null);
    const elec_curr = elecCurr ? elecCurr.current_reading : null;

    // reading_date for informational purposes (use whichever reading exists)
    const readingDateForDue = (waterCurr && waterCurr.reading_date) || (elecCurr && elecCurr.reading_date) || null;

    // 7) Compute due date from billingDueDay but anchored to readingDateForDue or today
    const refDate = readingDateForDue ? new Date(readingDateForDue) : today;
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const safeDay = Math.min(Math.max(1, billingDueDay), daysInMonth);
    const computedDueDate = ymd(new Date(year, month, safeDay));

    // 8) Build existingBilling object
    const existingBilling = {
      billing_id,
      billing_period: billing_period ?? ymd(monthStart),
      due_date: computedDueDate,
      total_amount_due,
      reading_date: ymd(readingDateForDue),
      water_prev: water_prev ?? null,
      water_curr: water_curr ?? null,
      elec_prev: elec_prev ?? null,
      elec_curr: elec_curr ?? null,
      additional_charges: additional.map((c) => ({
        id: c.id,
        charge_type: c.charge_type,
        amount: c.amount,
        charge_category: "additional",
      })),
      discounts: discounts.map((d) => ({
        id: d.id,
        charge_type: d.charge_type,
        amount: d.amount,
        charge_category: "discount",
      })),
    };

    return NextResponse.json(
      {
        unit: {
          ...unit,
          effective_rent_amount: effectiveRentAmount,
        },
        property,
        dueDate: existingBilling.due_date,
        existingBilling,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DB Error (getUnitBilling):", error);
    return NextResponse.json({ error: "DB Server Error" }, { status: 500 });
  }
}

/*
  -- Sample inserts (ensure values match your unit_id format)
  INSERT INTO WaterMeterReading (unit_id, period_start, period_end, reading_date, previous_reading, current_reading)
  VALUES
  ('UNIT001', '2025-01-01', '2025-01-31', '2025-01-31', 120.00, 135.00),
  ('UNIT001', '2025-02-01', '2025-02-28', '2025-02-28', 135.00, 150.00);

  INSERT INTO ElectricMeterReading (unit_id, period_start, period_end, reading_date, previous_reading, current_reading)
  VALUES
  ('UNIT001', '2025-01-01', '2025-01-31', '2025-01-31', 980.00, 1050.00),
  ('UNIT001', '2025-02-01', '2025-02-28', '2025-02-28', 1050.00, 1120.00);
*/
