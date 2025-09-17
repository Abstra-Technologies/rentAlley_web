
import mysql from "mysql2/promise";

export async function POST() {
    console.log("Checking for expired subscriptions...");

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const today = new Date().toISOString().split("T")[0];

        const [expiredSubscriptions] = await connection.execute(
            "SELECT landlord_id FROM Subscription WHERE end_date < ? AND is_active = 1",
            [today]
        );

        // @ts-ignore
        if (expiredSubscriptions.length === 0) {
            console.log("No expired subscriptions found.");
            await connection.end();
            return Response.json({ message: "No expired subscriptions found." }, { status: 200 });
        }

        // @ts-ignore
        console.log(`Downgrading ${expiredSubscriptions.length} expired subscriptions...`);

        // @ts-ignore
        for (const { landlord_id } of expiredSubscriptions) {
            await connection.execute(
                "UPDATE Subscription SET plan_name = 'Free Plan', is_active = 1, is_trial = 0, start_date= NOW(), end_date=0, payment_status = 'paid', updated_at = NOW() WHERE landlord_id = ?",
                [landlord_id]
            );
            console.log(`Sent downgrade notification to landlord_id: ${landlord_id}`);
        }

        await connection.end();
        return Response.json(
            { message: "Downgraded expired subscriptions successfully." },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error downgrading expired subscriptions:", error);
        // @ts-ignore

        return Response.json(// @ts-ignore
            { error: "Failed to downgrade expired subscriptions.", details: error.message },
            { status: 500 }
        );
    }
}
