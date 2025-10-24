// @utils/id_generation.ts
const { db } = require("../lib/cronDB");

async function generateBillID() {
    let billId;
    let isUnique = false;

    while (!isUnique) {
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        billId = `UPKYPBILL${random}`;

        const [rows]: any = await db.query(
            `SELECT 1 FROM Billing WHERE billing_id = ? LIMIT 1`,
            [billId]
        );

        if (rows.length === 0) {
            isUnique = true;
        }
    }

    return billId;
}

module.exports = { generateBillID };
