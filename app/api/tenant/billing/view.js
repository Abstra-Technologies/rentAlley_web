import { db } from "../../../../lib/db";


export default async function getBillingofTenant(req, res) {
    if (req.method === "GET") {
        try {
            const { tenant_id, unit_id } = req.query;

            if (!tenant_id) {
                return res.status(400).json({ error: "Either Tenant ID or Unit ID is required" });
            }

            let leaseQuery = `
                SELECT tenant_id, unit_id 
                FROM LeaseAgreement
                WHERE status = 'active'
            `;
            let leaseParams = [];

            if (tenant_id) {
                leaseQuery += " AND tenant_id = ?";
                leaseParams.push(tenant_id);
            }
            if (unit_id) {
                leaseQuery += " AND unit_id = ?";
                leaseParams.push(unit_id);
            }

            const [leaseAgreements] = await db.execute(leaseQuery, leaseParams);

            if (leaseAgreements.length === 0) {
                return res.status(404).json({ message: "No active lease agreements found" });
            }

            const lease = leaseAgreements[0];

            const [billings] = await db.execute(
                `SELECT 
                    b.billing_id, 
                    b.unit_id, 
                    b.billing_period, 
                    b.total_water_amount, 
                    b.total_electricity_amount, 
                    b.penalty_amount, 
                    b.discount_amount, 
                    b.total_amount_due, 
                    b.status, 
                    b.due_date, 
                    b.paid_at,
                    u.unit_name
                 FROM Billing b
                 JOIN Unit u ON b.unit_id = u.unit_id
                 WHERE b.unit_id = ?
                 ORDER BY b.billing_period DESC`,
                [lease.unit_id]
            );

            if (billings.length === 0) {
                return res.status(404).json({ message: "No billing records found for this unit" });
            }

            // Fetch meter readings for each billing record
            const billingIds = billings.map((bill) => bill.billing_id);
            let meterReadings = [];

            if (billingIds.length > 0) {
                const [readings] = await db.execute(
                    `SELECT m.unit_id, m.utility_type, m.reading_date, m.previous_reading, m.current_reading
                     FROM MeterReading m
                              JOIN Billing b ON m.unit_id = b.unit_id
                     WHERE b.unit_id = ?`,
                    [lease.unit_id]
                );
                meterReadings = readings;
            }

            return res.status(200).json({
                leaseAgreement: lease,
                billings,
                meterReadings
            });

        } catch (error) {
            console.error("Error fetching billing records:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
