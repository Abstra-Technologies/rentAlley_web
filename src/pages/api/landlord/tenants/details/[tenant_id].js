import  {db} from "../../../../../lib/db";
import {decryptData} from "../../../../../crypto/encrypt";

export default async function getTenantDetails(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    const  { tenant_id } = req.query;

    if (!tenant_id) {
        return res.status(400).json({ message: "Missing tenant_id parameter" });
    }

    try {

        // Query to fetch tenant details
        const [result] = await db.execute(
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

        if (result.length === 0) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        const tenant = {
            ...result[0],
            email: decryptData(JSON.parse(result[0].email), process.env.ENCRYPTION_SECRET),
        };

        res.status(200).json(tenant || []);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}