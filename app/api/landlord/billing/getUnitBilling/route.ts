import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unit_id = searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json({ error: "Missing unit_id" }, { status: 400 });
  }

  try {
    // 1️⃣ Fetch Unit + Property Info
    const [unitResult] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM Unit WHERE unit_id = ?`,
        [unit_id]
    );
    if (unitResult.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    const unit = unitResult[0];

    const [propertyResult] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM Property WHERE property_id = ?`,
        [unit.property_id]
    );
    const property = propertyResult.length > 0 ? propertyResult[0] : null;

    // 2️⃣ Get Property Billing Config (for due date rule)
    const [configResult] = await db.execute<RowDataPacket[]>(
        `SELECT billingDueDay FROM PropertyConfiguration WHERE property_id = ? LIMIT 1`,
        [unit.property_id]
    );
    const billingDueDay = configResult[0]?.billingDueDay
        ? parseInt(configResult[0].billingDueDay, 10)
        : null;

    // 3️⃣ Check Existing Billing for Current Month
    const [billingResult] = await db.execute<RowDataPacket[]>(
        `
          SELECT *
          FROM Billing
          WHERE unit_id = ?
            AND DATE_FORMAT(billing_period, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
          LIMIT 1
        `,
        [unit_id]
    );

    let existingBilling: any = null;
    let readingDateForDue: string | null = null;

    if (billingResult.length > 0) {
      // ✅ Case A: Billing already exists → include its readings + charges
      const billing = billingResult[0];
      const billing_id = billing.billing_id;

      const [meterReadings] = await db.execute<RowDataPacket[]>(
          `
            SELECT utility_type, previous_reading, current_reading, reading_date
            FROM MeterReading
            WHERE unit_id = ?
              AND DATE_FORMAT(reading_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
          `,
          [unit_id, billing.billing_period]
      );

      // ✅ Include id in select query
      const [charges] = await db.execute<RowDataPacket[]>(
          `
            SELECT id, charge_category, charge_type, amount
            FROM BillingAdditionalCharge
            WHERE billing_id = ?
          `,
          [billing_id]
      );

      // ✅ Split into additional & discount categories
      const additionalCharges = charges.filter(
          (c) => c.charge_category === "additional"
      );
      const discounts = charges.filter((c) => c.charge_category === "discount");

      const waterReading = meterReadings.find(
          (r) => r.utility_type === "water"
      );
      const elecReading = meterReadings.find(
          (r) => r.utility_type === "electricity"
      );

      readingDateForDue =
          waterReading?.reading_date ||
          elecReading?.reading_date ||
          billing.billing_period;

      // ✅ Format date safely for frontend (YYYY-MM-DD)
      const formatDate = (d: any) =>
          d ? new Date(d).toISOString().split("T")[0] : null;

      existingBilling = {
        billing_id,
        billing_period: formatDate(billing.billing_period),
        due_date: formatDate(billing.due_date),
        total_amount_due: billing.total_amount_due,
        reading_date: formatDate(readingDateForDue),
        water_prev: waterReading?.previous_reading || null,
        water_curr: waterReading?.current_reading || null,
        elec_prev: elecReading?.previous_reading || null,
        elec_curr: elecReading?.current_reading || null,
        // ✅ Include id in the charges so frontend can delete them
        additional_charges: additionalCharges.map((c) => ({
          id: c.id,
          charge_type: c.charge_type,
          amount: c.amount,
          charge_category: c.charge_category,
        })),
        discounts: discounts.map((d) => ({
          id: d.id,
          charge_type: d.charge_type,
          amount: d.amount,
          charge_category: d.charge_category,
        })),
      };
    } else {
      // ✅ Case B: No billing yet → get last readings and compute due date
      const [latestReadings] = await db.execute<RowDataPacket[]>(
          `
            SELECT utility_type, previous_reading, current_reading, reading_date
            FROM MeterReading
            WHERE unit_id = ?
            ORDER BY reading_date DESC
            LIMIT 2
          `,
          [unit_id]
      );

      const waterReading = latestReadings.find(
          (r) => r.utility_type === "water"
      );
      const elecReading = latestReadings.find(
          (r) => r.utility_type === "electricity"
      );

      readingDateForDue =
          waterReading?.reading_date || elecReading?.reading_date || null;

      // Compute Due Date Based on Reading Date
      let dueDate: string;
      if (readingDateForDue) {
        const reading = new Date(readingDateForDue);
        const year = reading.getFullYear();
        const month = reading.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const safeDay = Math.min(billingDueDay || 30, daysInMonth);
        dueDate = new Date(year, month, safeDay).toISOString().split("T")[0];
      } else {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const safeDay = Math.min(billingDueDay || 30, daysInMonth);
        dueDate = new Date(year, month, safeDay).toISOString().split("T")[0];
      }

      existingBilling = {
        billing_id: null,
        billing_period: new Date().toISOString().split("T")[0],
        due_date: dueDate,
        total_amount_due: null,
        reading_date: readingDateForDue
            ? new Date(readingDateForDue).toISOString().split("T")[0]
            : null,
        water_prev: waterReading?.previous_reading || null,
        water_curr: waterReading?.current_reading || null,
        elec_prev: elecReading?.previous_reading || null,
        elec_curr: elecReading?.current_reading || null,
        additional_charges: [],
        discounts: [],
      };
    }

    // ✅ Final Response
    return NextResponse.json(
        {
          unit,
          property,
          dueDate:
              existingBilling?.due_date ||
              (readingDateForDue
                  ? new Date(readingDateForDue).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0]),
          existingBilling,
        },
        { status: 200 }
    );
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: "DB Server Error" }, { status: 500 });
  }
}
