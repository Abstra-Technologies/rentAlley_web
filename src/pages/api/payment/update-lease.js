import mysql from "mysql2/promise";

export default async function updateLeasePayment(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { agreement_id, payment_type, requestReferenceNumber, amount } = req.body;
        if (!agreement_id || !payment_type || !requestReferenceNumber || !amount) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        let fieldToUpdate;
        if (payment_type === "security_deposit") {
            fieldToUpdate = "is_security_deposit_paid";
        } else if (payment_type === "advance_rent") {
            fieldToUpdate = "is_advance_payment_paid";
        } else {
            return res.status(400).json({ message: "Invalid payment type." });
        }

        const dbHost = process.env.DB_HOST;
        const dbUser = process.env.DB_USER;
        const dbPassword = process.env.DB_PASSWORD;
        const dbName = process.env.DB_NAME;

        let connection;

        try {
            connection = await mysql.createConnection({
                host: dbHost,
                user: dbUser,
                password: dbPassword,
                database: dbName,
            });

            const [existingPayment] = await connection.execute(
                `SELECT * FROM Payment WHERE receipt_reference = ? LIMIT 1`,
                [requestReferenceNumber]
            );

            if (existingPayment.length > 0) {
                await connection.end();
                return res.status(400).json({ message: "Payment already recorded." });
            }

            // Insert payment record into `Payment` table
            await connection.execute(
                `INSERT INTO Payment (payment_type, amount_paid, payment_method_id, payment_status, receipt_reference, created_at, agreement_id)
                 VALUES (?, ?, ?, 'confirmed', ?, NOW(),?)`,
                [payment_type, amount, 1, requestReferenceNumber,agreement_id]
            );

            // Update `LeaseAgreement` payment status
            const [result] = await connection.execute(
                `UPDATE LeaseAgreement 
                 SET ${fieldToUpdate} = 1, updated_at = CURRENT_TIMESTAMP
                 WHERE agreement_id = ?`,
                [agreement_id]
            );

            await connection.end();

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Lease agreement not found." });
            }

            return res.status(200).json({
                message: `Payment for ${payment_type} recorded successfully.`,
                requestReferenceNumber,
            });

        } catch (dbError) {
            console.error("Database Error:", dbError);
            if (connection) await connection.end();
            return res.status(500).json({ message: "Database Error", error: dbError.message });
        }

    } catch (error) {
        console.error("Error updating lease payment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
