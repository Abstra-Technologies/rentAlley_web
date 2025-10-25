const cron = require("node-cron");
const { db } = require("../lib/cronDB");
const { generateBillId } = require("@utils/id_generator");
require("dotenv").config();


async function generateNonSubmeteredBilling() {
    const today = new Date();
    const billingPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

    console.log(
        `🚀 Running Non-Submetered Billing Cron for period: ${billingPeriod} (executed on ${today.toISOString()})`
    );

    // ✅ Fetch eligible active leases (non-submetered only)
    const [agreements]: any = await db.query(
        `
            SELECT
                la.agreement_id,
                la.tenant_id,
                la.unit_id,
                un.rent_amount,
                un.property_id,
                COALESCE(pc.billingDueDay, 7) AS property_due_day
            FROM LeaseAgreement la
                     JOIN Unit un ON la.unit_id = un.unit_id
                     JOIN Property p ON un.property_id = p.property_id
                     LEFT JOIN PropertyConfiguration pc ON p.property_id = pc.property_id
            WHERE la.status IN ('active', 'completed')
              AND la.start_date <= ?
              AND (la.end_date IS NULL OR la.end_date >= ?)
              AND (p.water_billing_type != 'submetered' OR p.electricity_billing_type != 'submetered')
            GROUP BY la.agreement_id, la.unit_id, un.rent_amount, un.property_id, pc.billingDueDay
        `,
        [billingPeriod, billingPeriod]
    );

    console.log(`📄 Found ${agreements.length} eligible agreements.`);

    for (const ag of agreements) {
        const total = Number(ag.rent_amount);
        const dueDate = new Date(billingPeriod);
        dueDate.setDate(ag.property_due_day);

        // ✅ Check if billing already exists for this month
        const [existing]: any = await db.query(
            `SELECT billing_id, status FROM Billing WHERE unit_id = ? AND billing_period = ? LIMIT 1`,
            [ag.unit_id, billingPeriod]
        );

        let billingId: number;

        if (existing.length === 0) {
            // 🟢 Generate unique bill_id first
            const billId = await generateBillId();

            // 🟢 Create new billing record
            const [result]: any = await db.query(
                `
                INSERT INTO Billing
                (bill_id, lease_id, unit_id, billing_period, total_water_amount, total_electricity_amount, total_amount_due, due_date, status)
                VALUES (?, ?, ?, ?, 0.00, 0.00, ?, ?, 'unpaid')
                `,
                [billId, ag.agreement_id, ag.unit_id, billingPeriod, total, dueDate]
            );

            billingId = result.insertId;
            console.log(`✅ Created billing ${billId} (#${billingId}) for unit ${ag.unit_id} (due ${dueDate.toDateString()})`);
        } else {
            // 🔁 Update if not finalized or paid
            const existingBill = existing[0];
            billingId = existingBill.billing_id;

            if (["paid", "finalized"].includes(existingBill.status)) {
                console.log(`⏩ Billing ${billingId} already ${existingBill.status}, skipping update.`);
                continue;
            }

            await db.query(
                `
                    UPDATE Billing
                    SET total_amount_due = ?, due_date = ?, updated_at = NOW()
                    WHERE billing_id = ?
                `,
                [total, dueDate, billingId]
            );
            console.log(`🔁 Updated billing ${billingId} for unit ${ag.unit_id}.`);
        }

        // ✅ Check cleared PDCs
        const [pdcRows]: any = await db.query(
            `
                SELECT pdc_id, check_number, bank_name, amount
                FROM PostDatedCheck
                WHERE lease_id = ?
                  AND status = 'cleared'
                  AND MONTH(due_date) = MONTH(?)
                  AND YEAR(due_date) = YEAR(?)
                LIMIT 1
            `,
            [ag.agreement_id, billingPeriod, billingPeriod]
        );

        if (pdcRows.length > 0) {
            const pdc = pdcRows[0];
            const randomNum = Math.floor(1000000000000 + Math.random() * 9000000000000); // 13-digit
            const reference = `UPKYP-PDC-${randomNum}`;

            // ✅ Check if payment already recorded for this agreement
            const [existingPayment]: any = await db.query(
                `
                    SELECT payment_id
                    FROM Payment
                    WHERE agreement_id = ?
                      AND payment_method_id = 8
                      AND payment_status = 'confirmed'
                    LIMIT 1
                `,
                [ag.agreement_id]
            );

            if (existingPayment.length === 0) {
                // 🧾 Insert Payment record
                await db.query(
                    `
                        INSERT INTO Payment
                        (agreement_id, payment_type, amount_paid, payment_method_id, payment_status, payment_date, receipt_reference)
                        VALUES (?, 'billing', ?, 8, 'confirmed', NOW(), ?)
                    `,
                    [ag.agreement_id, pdc.amount, reference]
                );

                console.log(`🧾 Payment added for Agreement ${ag.agreement_id} (${reference})`);
            }

            // ✅ Mark billing as paid
            await db.query(
                `
                    UPDATE Billing
                    SET status = 'paid', paid_at = NOW()
                    WHERE billing_id = ?
                `,
                [billingId]
            );
            console.log(`💰 Billing ${billingId} marked as PAID (PDC Cleared, ref: ${reference})`);
        } else {
            console.log(`🧩 No cleared PDC for Agreement ${ag.agreement_id}`);
        }
    }

    console.log("🎯 Non-Submetered Billing Cron completed successfully.");
}


cron.schedule("* * * * *", () => {
    console.log("🔥 Cron test fired (every minute)!");
    generateNonSubmeteredBilling().catch(console.error);
});


// cron.schedule("0 0 30 * *", () => {
//     console.log("🚀 Cron triggered on the 30th!");
//     generateNonSubmeteredBilling().catch(console.error);
// });