
// scripts/cron/generateNonSubmeteredBilling.ts
const cron = require("node-cron");
const { db } = require("../lib/cronDB");
require("dotenv").config();

async function generateNonSubmeteredBilling() {
    const today = new Date();
    const billingPeriod = `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, "0")}-01`;

    console.log(
        `🚀 Running Non-Submetered Billing Cron for period: ${billingPeriod} (executed on ${today.toISOString()})`
    );

    const [agreements]: any = await db.query(
        `
        SELECT 
            la.agreement_id,
            la.unit_id,
            la.billing_due_day,
            un.rent_amount,
            un.property_id,
            COALESCE(SUM(
              CASE 
                WHEN e.frequency = 'monthly' THEN e.amount
                ELSE 0
              END
            ), 0) AS additional_charges
        FROM LeaseAgreement la
        JOIN Unit un ON la.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        LEFT JOIN LeaseAdditionalExpense e ON la.agreement_id = e.agreement_id
        WHERE la.status = 'active'
          AND (p.water_billing_type != 'submetered' OR p.electricity_billing_type != 'submetered')
        GROUP BY la.agreement_id, la.unit_id, la.billing_due_day, un.rent_amount, un.property_id
        `
    );

    for (const ag of agreements) {
        const total = Number(ag.rent_amount) + Number(ag.additional_charges);

        const [existing]: any = await db.query(
            `SELECT billing_id FROM Billing WHERE unit_id = ? AND billing_period = ?`,
            [ag.unit_id, billingPeriod]
        );

        if (existing.length > 0) {
            console.log(`⚠️ Billing already exists for unit ${ag.unit_id}`);
            continue;
        }

        const dueDate = new Date(billingPeriod);
        dueDate.setDate(ag.billing_due_day || 7);

        await db.query(
            `
            INSERT INTO Billing
            (unit_id, billing_period, total_water_amount, total_electricity_amount, total_amount_due, due_date, status)
            VALUES (?, ?, 0.00, 0.00, ?, ?, 'unpaid')
            `,
            [ag.unit_id, billingPeriod, total, dueDate]
        );

        console.log(`✅ Billing created for unit ${ag.unit_id} (due ${dueDate.toDateString()})`);
    }
}

cron.schedule("* * * * *", () => {
    console.log("🔥 Cron test fired (every minute)!");
    generateNonSubmeteredBilling().catch(console.error);
});

// cron.schedule("0 0 30 * *", () => {
//     console.log("🚀 Cron triggered on the 30th!");
//     generateNonSubmeteredBilling().catch(console.error);
// });



// async function generateNonSubmeteredBilling() {
//     const today = new Date();
//     const billingPeriod = `${today.getFullYear()}-${String(
//         today.getMonth() + 1
//     ).padStart(2, "0")}-01`;
//
//     console.log("Running Non-Submetered Billing Cron:", billingPeriod);
//
//     // Get agreements for non-submetered properties
//     const [agreements]: any = await db.query(
//         `
//     SELECT
//         la.agreement_id,
//         la.unit_id,
//         la.billing_due_day,
//         un.rent_amount,
//         un.property_id,
//         COALESCE(SUM(
//           CASE
//             WHEN e.frequency = 'monthly' THEN e.amount
//             ELSE 0
//           END
//         ), 0) AS additional_charges
//     FROM LeaseAgreement la
//     JOIN Unit un ON la.unit_id = un.unit_id
//     JOIN Property p ON un.property_id = p.property_id
//     LEFT JOIN LeaseAdditionalExpense e ON la.agreement_id = e.agreement_id
//     WHERE la.status = 'active'
//       AND (p.water_billing_type != 'submetered' OR p.electricity_billing_type != 'submetered')
//     GROUP BY la.agreement_id, la.unit_id, la.billing_due_day, un.rent_amount, un.property_id
//     `
//     );
//
//     for (const ag of agreements) {
//         const total = Number(ag.rent_amount) + Number(ag.additional_charges);
//
//         // Check if billing already exists
//         const [existing]: any = await db.query(
//             `SELECT billing_id FROM Billing WHERE unit_id = ? AND billing_period = ?`,
//             [ag.unit_id, billingPeriod]
//         );
//
//         if (existing.length > 0) {
//             console.log(`⚠️ Billing already exists for unit ${ag.unit_id}`);
//             continue;
//         }
//
//         // Compute due_date
//         const dueDate = new Date(billingPeriod);
//         dueDate.setDate(ag.billing_due_day || 7);
//
//         // Insert billing record
//         await db.query(
//             `
//       INSERT INTO Billing
//       (unit_id, billing_period, total_water_amount, total_electricity_amount, total_amount_due, due_date, status)
//       VALUES (?, ?, 0.00, 0.00, ?, ?, 'unpaid')
//       `,
//             [ag.unit_id, billingPeriod, total, dueDate]
//         );
//
//         console.log(`✅ Billing created for unit ${ag.unit_id}`);
//     }
// }

// Run on 1st of every month at 00:00
// cron.schedule("0 0 1 * *", () => {
//     generateNonSubmeteredBilling().catch(console.error);
// });