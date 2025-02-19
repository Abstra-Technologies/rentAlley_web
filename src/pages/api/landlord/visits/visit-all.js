import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  const { landlord_id } = req.query;

  if (!landlord_id) {
    return res.status(400).json({ message: "Missing landlord_id" });
  }

  try {
    const [requests] = await db.query(
      `SELECT 
          pv.visit_id,
          u.user_id,
          u.firstName AS tenant_first_name,
          u.lastName AS tenant_last_name,
          p.property_name,
          COALESCE(un.unit_name, 'N/A') AS unit_name,
          pv.visit_date,
          pv.visit_time,
          pv.status
      FROM PropertyVisit pv
      JOIN Tenant t ON pv.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      JOIN Property p ON pv.property_id = p.property_id
      LEFT JOIN Unit un ON pv.unit_id = un.unit_id
      WHERE p.landlord_id = ?;`,
      [landlord_id]
    );

    // Decrypt first and last names
    const decryptedRequests = requests.map((request) => {
      let tenantFirstName = "N/A";
      let tenantLastName = "N/A";

      try {
        tenantFirstName = decryptData(
          JSON.parse(request.tenant_first_name),
          process.env.ENCRYPTION_SECRET
        );
      } catch (err) {
        console.error("Error decrypting first name:", err);
      }

      try {
        tenantLastName = decryptData(
          JSON.parse(request.tenant_last_name),
          process.env.ENCRYPTION_SECRET
        );
      } catch (err) {
        console.error("Error decrypting last name:", err);
      }

      return {
        ...request,
        tenant_first_name: tenantFirstName,
        tenant_last_name: tenantLastName,
      };
    });

    // Return decrypted data
    res.status(200).json(decryptedRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
}
