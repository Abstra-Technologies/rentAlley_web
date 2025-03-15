
// checking fi trial

import mysql from "mysql2/promise";

export default async function grantingFreeTrialHandler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST method is allowed." });
    }

    console.log(`Debug: Received request body:`, req.body);
    const { landlord_id, plan_name } = req.body;

    if (!landlord_id) {
        console.error("Missing landlord_id.");
        return res.status(400).json({ error: "Missing landlord_id." });
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log(`Checking database for landlord_id: ${landlord_id}`);
        const [landlordData] = await connection.execute(
            "SELECT is_trial_used FROM Landlord WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );

        console.log(`Debug: Fetched landlordData:`, landlordData);

        if (!landlordData.length) {
            console.error(`No landlord found with landlord_id: ${landlord_id}`);
            await connection.end();
            return res.status(404).json({ error: "Landlord not found." });
        }

        const { is_trial_used } = landlordData[0];

        console.log(`Landlord found: landlord_id: ${landlord_id}, is_trial_used: ${is_trial_used}`);

        if (!plan_name) {
            await connection.end();
            return res.status(200).json({ is_trial_used });
        }

        const startDate = new Date().toISOString().split("T")[0];

        if (plan_name === "Free Plan") {
            await connection.execute(
                "INSERT INTO Subscription (landlord_id, plan_name, start_date, end_date, payment_status, is_trial, created_at, request_reference_number, is_active) VALUES (?, ?, ?, '', 'paid', 0, NOW(), 0, 1)",
                [landlord_id, plan_name, startDate]
            );

            await connection.end();
            return res.status(201).json({ message: "Free Plan activated.", startDate });
        }

        // If the trial has already been used before no more trial to be granted.
        if (is_trial_used) {
            console.warn(`Trial already used for landlord_id: ${landlord_id}`);
            await connection.end();
            return res.status(403).json({ error: "Trial already used. Please subscribe to continue." });
        }

        // Activate Free Trial if a valid plan is selected
        if (["Standard Plan", "Premium Plan"].includes(plan_name)) {
            console.log(`Granting Free Trial for landlord_id: ${landlord_id} with ${plan_name}`);

            const trialDays = plan_name === "Standard Plan" ? 10 : 14;

            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + trialDays);
            const formattedTrialEndDate = trialEndDate.toISOString().split("T")[0];

            await connection.execute(
                "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?",
                [landlord_id]
            );

            await connection.execute(
                "INSERT INTO " +
                "Subscription (landlord_id, plan_name, start_date, end_date, payment_status, is_trial, created_at, request_reference_number, is_active)" +
                " VALUES (?, ?, ?, ?, 'paid', 1, NOW(), 0, 1)",
                [landlord_id, plan_name, startDate, formattedTrialEndDate]
            );

            await connection.execute(
                "UPDATE Landlord SET is_trial_used = 1 WHERE landlord_id = ?",
                [landlord_id]
            );

            await connection.end();
            return res.status(201).json({ message: `${trialDays}-day free trial activated.`, trialEndDate: formattedTrialEndDate });
        }

        await connection.end();
        return res.status(400).json({ error: "Invalid plan selection." });

    } catch (error) {
        console.error(" Database update failed:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}