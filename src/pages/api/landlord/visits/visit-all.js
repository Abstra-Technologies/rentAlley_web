import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { landlord_id } = req.query;
  let queryString;
  let queryParams = [];

  try {
    // Dynamic query based on whether landlord_id is provided
    if (landlord_id) {
      queryString = `
        SELECT 
            pv.visit_id,
            u.user_id,
            u.firstName AS encrypted_first_name,
            u.lastName AS encrypted_last_name,
            p.property_name,
            un.unit_name,
            pv.visit_date,
            pv.visit_time,
            pv.status,
            pv.disapproval_reason
        FROM PropertyVisit pv
        JOIN Tenant t ON pv.tenant_id = t.tenant_id
        JOIN User u ON t.user_id = u.user_id
        JOIN Unit un ON pv.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        WHERE p.landlord_id = ?
        ORDER BY pv.visit_date ASC, pv.visit_time ASC;`;
      
      queryParams = [landlord_id];
    } else {
      queryString = `
        SELECT 
            pv.visit_id,
            u.user_id,
            u.firstName AS encrypted_first_name,
            u.lastName AS encrypted_last_name,
            p.property_name,
            un.unit_name,
            pv.visit_date,
            pv.visit_time,
            pv.status,
            pv.disapproval_reason
        FROM PropertyVisit pv
        JOIN Tenant t ON pv.tenant_id = t.tenant_id
        JOIN User u ON t.user_id = u.user_id
        JOIN Unit un ON pv.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        ORDER BY pv.visit_date ASC, pv.visit_time ASC;`;
    }

    const [requests] = await db.query(queryString, queryParams);

    // Decrypt first and last names
    const decryptedRequests = requests.map((request) => {
      let tenantFirstName = "N/A";
      let tenantLastName = "N/A";

      try {
        tenantFirstName = decryptData(
          JSON.parse(request.encrypted_first_name),
          process.env.ENCRYPTION_SECRET
        );
      } catch (err) {
        console.error("Error decrypting first name:", err);
      }

      try {
        tenantLastName = decryptData(
          JSON.parse(request.encrypted_last_name),
          process.env.ENCRYPTION_SECRET
        );
      } catch (err) {
        console.error("Error decrypting last name:", err);
      }

      return {
        ...request,
        tenant_first_name: tenantFirstName,
        tenant_last_name: tenantLastName,
        status: request.status,
        disapproval_reason: request.disapproval_reason
      };
    });

    res.status(200).json(decryptedRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
}