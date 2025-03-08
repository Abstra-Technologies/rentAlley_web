import  {db} from "../../../../lib/db";


export default async function getOutstandingPaymentsReceivable(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ message: "Missing landlord_id parameter" });
    }

    try {
        const [rows] = await db.execute(
            `SELECT SUM(b.total_amount_due) AS total_receivables
            FROM Billing b
            JOIN Unit u ON b.unit_id = u.unit_id
            JOIN Property pr ON u.property_id = pr.property_id
            WHERE pr.landlord_id = ?
              AND b.status IN ('unpaid', 'overdue');`,
            [landlord_id]
        );

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching receivables:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}