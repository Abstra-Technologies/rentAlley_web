const cron = require("node-cron");
const { db } = require("../lib/cronDB");
require("dotenv").config();

async function adjustLatePayments() {
    console.log(`[CRON] 🕛 Running late payment adjustment at ${new Date().toISOString()}`);

    try {
        // Fetch all unpaid or overdue billings along with property configurations
        const [billings]: any = await db.query(`
      SELECT 
        b.billing_id,
        b.total_amount_due,
        b.due_date,
        b.status,
        u.property_id,
        p.property_name,
        pc.lateFeeType,
        pc.lateFeeAmount,
        pc.gracePeriodDays
      FROM rentalley_db.Billing b
      JOIN rentalley_db.Unit u ON b.unit_id = u.unit_id
      JOIN rentalley_db.Property p ON u.property_id = p.property_id
      JOIN rentalley_db.PropertyConfiguration pc ON p.property_id = pc.property_id
      WHERE b.status IN ('unpaid', 'overdue')
    `);

        if (!billings.length) {
            console.log("✅ No unpaid or overdue billings found.");
            return;
        }

        let updatedCount = 0;
        const today = new Date();

        for (const bill of billings) {
            const dueDate = new Date(bill.due_date);
            const graceLimit = new Date(dueDate);
            graceLimit.setDate(graceLimit.getDate() + bill.gracePeriodDays);

            // Only apply penalty if past the grace period
            if (today <= graceLimit) continue;

            let penalty = 0;
            if (bill.lateFeeType === "percentage") {
                penalty = (Number(bill.lateFeeAmount) / 100) * Number(bill.total_amount_due);
            } else {
                penalty = Number(bill.lateFeeAmount);
            }

            const newTotal = Number(bill.total_amount_due) + penalty;

            await db.query(
                `
          UPDATE rentalley_db.Billing
          SET total_amount_due = ?, status = 'overdue', updated_at = NOW()
          WHERE billing_id = ?
        `,
                [newTotal, bill.billing_id]
            );

            updatedCount++;
            console.log(
                `⚠️ Billing #${bill.billing_id} (${bill.property_name}) - penalty ₱${penalty.toFixed(
                    2
                )} applied. New total: ₱${newTotal.toFixed(2)}`
            );
        }

        console.log(`✅ Late payment adjustments complete. ${updatedCount} billing(s) updated.`);
    } catch (error) {
        console.error("❌ Error running late payment cron:", error);
    }
}

// Run daily at midnight (Asia/Manila)
// cron.schedule("0 0 * * *", adjustLatePayments, {
//     scheduled: true,
//     timezone: "Asia/Manila",
// });

cron.schedule("* * * * *", () => {
    console.log("🔥 Cron test fired (every minute)!");
    adjustLatePayments().catch(console.error);
});

