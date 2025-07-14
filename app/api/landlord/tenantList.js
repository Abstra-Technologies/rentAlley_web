import  {db} from "../../../lib/db";
import {decryptData} from "../../../crypto/encrypt";

export default async function getListofTenants(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    const { landlord_id } = req.query;

    try {
        const [tenants] = await db.execute(
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
                WHERE la.status = 'active' AND p.landlord_id = ?
                ORDER BY la.start_date DESC
            `,
            [landlord_id]
        );

        const decryptedTenants = tenants.map((tenant) => ({
            ...tenant,
            email: decryptData(JSON.parse(tenant.email), process.env.ENCRYPTION_SECRET),
            firstName: decryptData(JSON.parse(tenant.firstName), process.env.ENCRYPTION_SECRET),
            lastName: decryptData(JSON.parse(tenant.lastName), process.env.ENCRYPTION_SECRET),
        }));

        res.status(200).json(decryptedTenants  || []);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}