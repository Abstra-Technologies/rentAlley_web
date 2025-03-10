import { db } from "../../../../lib/db";

export default async function updateCurrentBilling(req, res) {
    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const {
        billing_id,
        reading_date,
        water_current_reading,
        electricity_current_reading,
        total_water_amount,
        total_electricity_amount,
        total_amount_due
    } = req.body;

    if (!billing_id) {
        return res.status(400).json({ error: "Billing ID is required" });
    }

    try {
        // Get unit_id from the billing record
        const [billingRecord] = await db.query(
            `SELECT unit_id FROM Billing WHERE billing_id = ?`,
            [billing_id]
        );

        if (!billingRecord || billingRecord.length === 0) {
            return res.status(404).json({ error: "Billing record not found" });
        }

        const unit_id = billingRecord[0].unit_id;

        // Update the billing record
        const [updateResult] = await db.query(
            `
            UPDATE Billing 
            SET 
                billing_period = ?, 
                total_water_amount = ?, 
                total_electricity_amount = ?, 
                total_amount_due = ?
            WHERE billing_id = ?
            `,
            [
                reading_date,
                total_water_amount,
                total_electricity_amount,
                total_amount_due,
                billing_id
            ]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "No changes made or billing record not found" });
        }

        // Update the latest water meter reading for the corresponding unit
        if (water_current_reading !== undefined) {
            await db.query(
                `
                    UPDATE MeterReading
                    SET current_reading = ?
                    WHERE unit_id = ?
                      AND utility_type = 'water'
                    ORDER BY reading_date DESC
                    LIMIT 1
                `,
                [water_current_reading, unit_id]
            );
        }

        // Update the latest electricity meter reading for the corresponding unit
        if (electricity_current_reading !== undefined) {
            await db.query(
                `
                UPDATE MeterReading 
                SET current_reading = ? 
                WHERE unit_id = ? 
                AND utility_type = 'electricity'
                ORDER BY reading_date DESC
                LIMIT 1
                `,
                [electricity_current_reading, unit_id]
            );
        }

        return res.status(200).json({ message: "Billing and meter readings updated successfully" });
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
