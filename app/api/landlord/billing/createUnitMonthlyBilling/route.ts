import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const connection = await db.getConnection();

  try {
    const {
      unit_id,
      readingDate,
      dueDate,
      waterPrevReading,
      waterCurrentReading,
      electricityPrevReading,
      electricityCurrentReading,
      totalWaterAmount,
      totalElectricityAmount,
      total_amount_due,
      additionalCharges = [], // [{ charge_category, charge_type, amount }]
    } = await req.json();

    if (!unit_id || !readingDate || !dueDate) {
      return NextResponse.json(
          { error: "Missing required fields (unit_id, readingDate, dueDate)" },
          { status: 400 }
      );
    }

    await connection.beginTransaction();

    // 1️⃣ Find active or completed lease for this unit
    const [lease]: any = await connection.query(
        `SELECT agreement_id 
       FROM LeaseAgreement 
       WHERE unit_id = ? AND status IN ('active', 'completed')
       LIMIT 1`,
        [unit_id]
    );

    if (!lease.length) {
      await connection.rollback();
      return NextResponse.json(
          { error: "No active or completed lease found for this unit." },
          { status: 404 }
      );
    }

    const lease_id = lease[0].agreement_id;

    // 2️⃣ Check if a billing record already exists this month
    const [existing]: any = await connection.query(
        `SELECT billing_id
       FROM Billing
       WHERE unit_id = ?
         AND MONTH(billing_period) = MONTH(?)
         AND YEAR(billing_period) = YEAR(?)
       LIMIT 1`,
        [unit_id, readingDate, readingDate]
    );

    let billing_id;

    if (existing.length > 0) {
      // ✅ Update existing billing
      billing_id = existing[0].billing_id;
      await connection.query(
          `UPDATE Billing
         SET total_water_amount = ?, 
             total_electricity_amount = ?, 
             total_amount_due = ?, 
             due_date = ?, 
             status = 'unpaid', 
             updated_at = NOW()
         WHERE billing_id = ?`,
          [
            totalWaterAmount || 0,
            totalElectricityAmount || 0,
            total_amount_due || 0,
            dueDate,
            billing_id,
          ]
      );
    } else {
      // 🆕 Create new billing record
      const [insertResult]: any = await connection.query(
          `INSERT INTO Billing (
            lease_id, unit_id, billing_period, 
            total_water_amount, total_electricity_amount, 
            total_amount_due, due_date, status, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', NOW())`,
          [
            lease_id,
            unit_id,
            readingDate,
            totalWaterAmount || 0,
            totalElectricityAmount || 0,
            total_amount_due || 0,
            dueDate,
          ]
      );
      billing_id = insertResult.insertId;
    }

    // 3️⃣ Upsert Meter Readings
    const readings = [
      {
        type: "water",
        prev: waterPrevReading,
        curr: waterCurrentReading,
      },
      {
        type: "electricity",
        prev: electricityPrevReading,
        curr: electricityCurrentReading,
      },
    ];

    for (const r of readings) {
      if (r.prev && r.curr) {
        await connection.query(
            `INSERT INTO MeterReading 
             (unit_id, utility_type, reading_date, previous_reading, current_reading)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             previous_reading = VALUES(previous_reading),
             current_reading = VALUES(current_reading),
             updated_at = NOW()`,
            [unit_id, r.type, readingDate, r.prev, r.curr]
        );
      }
    }

    // 4️⃣ Delete old charges (to avoid duplicates)
    await connection.query(
        `DELETE FROM BillingAdditionalCharge WHERE billing_id = ?`,
        [billing_id]
    );

    // 5️⃣ Insert new additional/discount charges
    if (Array.isArray(additionalCharges) && additionalCharges.length > 0) {
      for (const charge of additionalCharges) {
        if (!charge.charge_type || isNaN(charge.amount)) continue;

        await connection.query(
            `INSERT INTO BillingAdditionalCharge 
           (billing_id, charge_category, charge_type, amount)
           VALUES (?, ?, ?, ?)`,
            [
              billing_id,
              charge.charge_category || "additional",
              charge.charge_type.trim(),
              parseFloat(charge.amount),
            ]
        );
      }
    }

    await connection.commit();

    return NextResponse.json(
        {
          success: true,
          billing_id,
          message:
              existing.length > 0
                  ? "Billing updated successfully with charges and readings"
                  : "Billing created successfully with charges and readings",
        },
        { status: 201 }
    );
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Error saving billing:", error);
    return NextResponse.json(
        { error: "Failed to save billing record.", details: error.message },
        { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
