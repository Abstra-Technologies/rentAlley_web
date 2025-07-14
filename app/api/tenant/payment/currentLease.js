import { db } from "../../../../lib/db";

export default async function getPaymentHistoryOfCurrentLease(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { tenant_id } = req.query;

        if (!tenant_id) {
            return res.status(400).json({ error: "Tenant ID is required" });
        }

        const [activeLease] = await db.execute(
            `SELECT agreement_id, tenant_id, unit_id
             FROM LeaseAgreement
             WHERE tenant_id = ? AND status = 'active' LIMIT 1`,
            [tenant_id]
        );
        console.log(activeLease);
        if (activeLease.length === 0) {
            return res.status(404).json({ error: "No active lease found for this tenant" });
        }

        const lease = activeLease[0];
        console.log(lease);
        const [payments] = await db.execute(
            `SELECT p.payment_id, p.agreement_id, p.payment_type, p.amount_paid,
                    p.payment_status, p.receipt_reference, p.payment_date,
                    pm.method_name AS payment_method
             FROM Payment p
                      JOIN PaymentMethod pm ON p.payment_method_id = pm.method_id
             WHERE p.agreement_id = ?
             ORDER BY p.payment_date DESC`,
            [lease.agreement_id]
        );
        console.log(payments);
        if (payments.length === 0) {
            return res.status(404).json({ message: "No payments found for the active lease" });
        }

        return res.status(200).json({
            leaseAgreement: lease,
            payments: payments
        });

    } catch (error) {
        return res.status(500).json({ error: `Database Error: ${error}` });
    }
}