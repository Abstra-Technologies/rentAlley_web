import { db } from "../../../../lib/db";

export default async function getAggregatedPaymentsperMonth(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ message: "Missing landlord_id parameter" });
    }

    try {
        const [rows] = await db.execute(
            `SELECT 
                DATE_FORMAT(p.payment_date, '%Y-%m') AS month, 
                SUM(p.amount_paid) AS total_received
            FROM Payment p
            JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
            JOIN Unit u ON la.unit_id = u.unit_id
            JOIN Property pr ON u.property_id = pr.property_id
            WHERE pr.landlord_id = ? 
              AND p.payment_status = 'confirmed'
            GROUP BY month
            ORDER BY month;`,
            [landlord_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching payment data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
