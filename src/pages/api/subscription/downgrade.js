import mysql from "mysql2/promise";

export default async function downgradeExpiredSubscriptions(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    console.log("🔍 Checking for expired subscriptions...");

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

        const today = new Date().toISOString().split("T")[0];

        const [expiredSubscriptions] = await connection.execute(
            "SELECT landlord_id FROM Subscription WHERE end_date < ? AND status = 'active'",
            [today]
        );

        if (expiredSubscriptions.length === 0) {
            console.log("✅ No expired subscriptions found.");
            await connection.end();
            return res.status(200).json({ message: "No expired subscriptions found." });
        }

        console.log(`Downgrading ${expiredSubscriptions.length} expired subscriptions...`);

        for (const { landlord_id } of expiredSubscriptions) {

            await connection.execute(
                "UPDATE Subscription SET plan_name = 'Free Plan', status = 'downgraded', payment_status = 'unpaid', updated_at = NOW() WHERE landlord_id = ?",
                [landlord_id]
            );

            console.log(`📩 Sent downgrade notification to landlord_id: ${landlord_id}`);
        }

        await connection.end();
        return res.status(200).json({ message: "Downgraded expired subscriptions successfully." });

    } catch (error) {
        console.error("🚨 Error downgrading expired subscriptions:", error);
        if (connection) await connection.end();
        return res.status(500).json({ error: "Failed to downgrade expired subscriptions.", details: error.message });
    }
}
