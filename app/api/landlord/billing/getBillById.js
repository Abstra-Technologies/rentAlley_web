import { db } from "../../../../lib/db";

export default async function getCurrentMonthBillingByUnit(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { unit_id } = req.query;

  if (!unit_id) {
    return res.status(400).json({ error: "Unit ID is required" });
  }

  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [bill] = await db.query(
        `
          SELECT * FROM Billing
          WHERE unit_id = ?
            AND YEAR(billing_period) = ?
            AND MONTH(billing_period) = ?
          ORDER BY billing_period DESC
          LIMIT 1
        `,
        [unit_id, currentYear, currentMonth]
    );

    if (!bill || bill.length === 0) {
      return res.status(404).json({ error: "No bill found for the current month" });
    }

    const billingRecord = bill[0];

    const [waterReading] = await db.query(
        `
          SELECT previous_reading, current_reading, reading_date
          FROM MeterReading
          WHERE unit_id = ? AND utility_type = 'water'
          ORDER BY reading_date DESC
          LIMIT 1
        `,
        [unit_id]
    );

    const [electricityReading] = await db.query(
        `
          SELECT previous_reading, current_reading, reading_date
          FROM MeterReading
          WHERE unit_id = ? AND utility_type = 'electricity'
          ORDER BY reading_date DESC
          LIMIT 1
        `,
        [unit_id]
    );

    const [unitData] = await db.query(
        `
        SELECT rent_amount, property_id
        FROM Unit
        WHERE unit_id = ?
      `,
        [unit_id]
    );

    if (!unitData || unitData.length === 0) {
      return res.status(404).json({ error: "Unit data not found" });
    }

    const { rent_amount, property_id } = unitData[0];

    const [propertyData] = await db.query(
        `
        SELECT assoc_dues, late_fee
        FROM Property
        WHERE property_id = ?
      `,
        [property_id]
    );

    if (!propertyData || propertyData.length === 0) {
      return res.status(404).json({ error: "Property data not found" });
    }

    const { assoc_dues, late_fee } = propertyData[0];

    res.status(200).json({
      ...billingRecord,
      water_prev_reading: waterReading.length > 0 ? waterReading[0].previous_reading : null,
      water_current_reading: waterReading.length > 0 ? waterReading[0].current_reading : null,
      electricity_prev_reading: electricityReading.length > 0 ? electricityReading[0].previous_reading : null,
      electricity_current_reading: electricityReading.length > 0 ? electricityReading[0].current_reading : null,
      rent_amount: rent_amount ?? 0,
      assoc_dues: assoc_dues ?? 0,
      late_fee: late_fee ?? 0,
    });
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
