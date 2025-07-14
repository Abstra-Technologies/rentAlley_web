
import { db } from "../../../lib/db";

export default async function saveBillandMeterReading(req, res) {
    if (req.method === "POST") {
        try {
            const {
                unit_id,
                readingDate,
                waterPrevReading,
                waterCurrentReading,
                electricityPrevReading,
                electricityCurrentReading,
                totalWaterAmount,
                totalElectricityAmount,
                penaltyAmount,
                discountAmount,
                dueDate,
                total_amount_due,
            } = req.body;

            console.log(
                unit_id,
                readingDate,
                waterPrevReading,
                waterCurrentReading,
                electricityPrevReading,
                electricityCurrentReading,
                totalWaterAmount,
                totalElectricityAmount,
                penaltyAmount,
                discountAmount,
                dueDate
            );

            const [billingResult] = await db.execute(
                `INSERT INTO Billing (unit_id, billing_period, total_water_amount, total_electricity_amount,
                                      penalty_amount, discount_amount, due_date, total_amount_due)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    unit_id,
                    readingDate,
                    totalWaterAmount || 0,
                    totalElectricityAmount || 0,
                    penaltyAmount || 0,
                    discountAmount || 0,
                    dueDate,
                    total_amount_due || 0,
                ]
            );

            const billingId = billingResult.insertId;

            if (waterPrevReading !== null && waterCurrentReading !== null) {
                await db.execute(
                    `INSERT INTO MeterReading (unit_id, utility_type, reading_date, previous_reading, current_reading)
                     VALUES (?, 'water', ?, ?, ?)`,
                    [unit_id, readingDate, waterPrevReading, waterCurrentReading]
                );
            }

            if (electricityPrevReading !== null && electricityCurrentReading !== null) {
                await db.execute(
                    `INSERT INTO MeterReading (unit_id, utility_type, reading_date, previous_reading, current_reading)
                     VALUES (?, 'electricity', ?, ?, ?)`,
                    [unit_id, readingDate, electricityPrevReading, electricityCurrentReading]
                );
            }
            return res.status(201).json({
                message: "Billing Generated and meter readings saved successfully",
                billing_id: billingId
            });

        } catch (error) {
            console.error("Error saving billing and meter readings:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
