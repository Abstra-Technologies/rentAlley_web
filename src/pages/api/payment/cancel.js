import mysql from "mysql2/promise";


export default async function cancelSubscription(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { requestReferenceNumber, landlord_id } = req.body;

    if (!requestReferenceNumber || !landlord_id) {
        return res.status(400).json({ error: "Missing required parameters." });
    }

    console.log("🔍 Debug - Cancelling Pending Subscription:", { requestReferenceNumber, landlord_id });

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

        // **Check if this is an upgrade attempt**
        const [pendingSubscription] = await connection.execute(
            "SELECT subscription_id, plan_name FROM Subscription WHERE request_reference_number = ? AND landlord_id = ? AND status = 'pending'",
            [requestReferenceNumber, landlord_id]
        );

        if (pendingSubscription.length === 0) {
            console.log("⚠️ No pending subscription found.");
            await connection.end();
            return res.status(200).json({ message: "No pending subscription to cancel." });
        }

        const newPlanName = pendingSubscription[0].plan_name;

        // **Check if landlord has an active subscription**
        const [activeSubscription] = await connection.execute(
            "SELECT subscription_id, plan_name FROM Subscription WHERE landlord_id = ? AND is_active = 1",
            [landlord_id]
        );

        if (activeSubscription.length > 0) {
            console.log(`🔹 Landlord has an active plan (${activeSubscription[0].plan_name}). Retaining it.`);
        }

        // **Delete only the pending upgrade (DO NOT DELETE ACTIVE PLAN)**
        await connection.execute(
            "DELETE FROM Subscription WHERE request_reference_number = ? AND landlord_id = ? AND status = 'pending'",
            [requestReferenceNumber, landlord_id]
        );

        await connection.end();

        return res.status(200).json({
            message: activeSubscription.length > 0
                ? `Upgrade to ${newPlanName} was cancelled. You are still on ${activeSubscription[0].plan_name}.`
                : "Subscription cancellation was attempted, but you have no active plan to retain."
        });
    } catch (error) {
        console.error("🚨 Error cancelling subscription:", error);
        if (connection) await connection.end();
        return res.status(500).json({ error: "Failed to cancel subscription.", details: error.message });
    }
}
