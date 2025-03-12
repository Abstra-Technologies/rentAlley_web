import  {db} from "../../../../../lib/db";
import {decryptData} from "../../../../../crypto/encrypt";

export default async function getTenantDetails(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { tenant_id } = req.query;

    if (!tenant_id) {
        return res.status(400).json({ message: "Missing tenant_id parameter" });
    }

    try {
        const [tenantResult] = await db.execute(
            `
                SELECT
                    t.tenant_id,
                    t.employment_type,
                    t.occupation,
                    u.firstName,
                    u.lastName,
                    u.email,
                    la.unit_id,
                    la.start_date,
                    p.property_name,
                    la.end_date
                FROM Tenant t
                         JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
                         JOIN Unit un ON la.unit_id = un.unit_id
                         JOIN Property p ON un.property_id = p.property_id
                         JOIN User u ON t.user_id = u.user_id
                WHERE t.tenant_id = ?
            `,
            [tenant_id]
        );

        if (tenantResult.length === 0) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        const tenant = {
            ...tenantResult[0],
            email: decryptData(JSON.parse(tenantResult[0].email), process.env.ENCRYPTION_SECRET),
            firstName: decryptData(JSON.parse(tenantResult[0].firstName), process.env.ENCRYPTION_SECRET),
            lastName: decryptData(JSON.parse(tenantResult[0].lastName), process.env.ENCRYPTION_SECRET),
        };

        const [paymentHistory] = await db.execute(
            `
            SELECT
                payment_id,
                agreement_id,
                payment_type,
                amount_paid,
                payment_method_id,
                payment_status,
                receipt_reference,
                payment_date,
                created_at,
                updated_at,
                proof_of_payment
            FROM Payment
            WHERE agreement_id = (SELECT agreement_id FROM LeaseAgreement WHERE tenant_id = ?)
            ORDER BY payment_date DESC
            `,
            [tenant_id]
        );

        res.status(200).json({ tenant, paymentHistory });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
