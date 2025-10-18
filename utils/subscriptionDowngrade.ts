// scripts/cron/downgradeExpiredSubscriptions.ts
// @ts-ignore
const cron = require("node-cron");
// @ts-ignore
const { db } = require("../lib/cronDB");
require("dotenv").config();

async function downgradeExpiredSubscriptions() {
    const today = new Date().toISOString().split("T")[0];

    console.log(
        `🚀 Running Downgrade Expired Subscriptions Cron (executed on ${new Date().toISOString()})`
    );

    const [expiredSubscriptions]: any = await db.query(
        `SELECT landlord_id FROM Subscription WHERE end_date < ? `,
        [today]
    );

    if (expiredSubscriptions.length === 0) {
        console.log("✅ No expired subscriptions found.");
        return;
    }

    console.log(
        `⚠️ Found ${expiredSubscriptions.length} expired subscription(s). Downgrading...`
    );

    for (const sub of expiredSubscriptions) {
        try {
            await db.query(
                `
                UPDATE Subscription 
                SET plan_name = 'Free Plan',
                    is_active = 1,
                    is_trial = 0,
                    start_date = NOW(),
                    end_date = DATE_ADD(NOW(), INTERVAL 1 YEAR),
                    payment_status = 'paid',
                    updated_at = NOW()
                WHERE landlord_id = ?
                `,
                [sub.landlord_id]
            );

            console.log(`✅ Downgraded landlord_id: ${sub.landlord_id}`);

            // OPTIONAL: notify the landlord (via Notification table)
            // await db.query(
            //   `INSERT INTO Notification (user_id, title, body, created_at)
            //    SELECT u.user_id, 'Subscription Downgraded', 'Your plan has been downgraded to Free Plan due to expiration.', NOW()
            //    FROM Landlord l JOIN User u ON l.user_id = u.user_id WHERE l.landlord_id = ?`,
            //   [sub.landlord_id]
            // );
        } catch (error) {

            console.error(
                `❌ Failed to downgrade landlord_id ${sub.landlord_id}:`,
                // @ts-ignore
                error.message
            );
        }
    }

    console.log("🎯 Downgrade process completed successfully.");
}

// 🕒 Run every day at midnight (00:00)
// cron.schedule("0 0 * * *", () => {
//     console.log("🔥 Subscription downgrade cron triggered!");
//     downgradeExpiredSubscriptions().catch(console.error);
// });


cron.schedule("* * * * *", () => {
    console.log("🔥 Cron test fired (every minute)!");
    downgradeExpiredSubscriptions().catch(console.error);
});
