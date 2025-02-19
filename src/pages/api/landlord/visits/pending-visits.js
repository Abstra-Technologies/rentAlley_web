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
                u.firstName AS encrypted_first_name,
                u.lastName AS encrypted_last_name,
                p.property_name,
                COALESCE(un.unit_name, 'N/A') AS unit_name,
                pv.visit_date,
                pv.visit_time
            FROM PropertyVisit pv
            JOIN Tenant t ON pv.tenant_id = t.tenant_id
            JOIN User u ON t.user_id = u.user_id
            JOIN Property p ON pv.property_id = p.property_id
            LEFT JOIN Unit un ON pv.unit_id = un.unit_id
            WHERE p.landlord_id = ? AND pv.status = 'pending';`,
      [landlord_id]
    );

    // Decrypt first and last names
    const decryptedRequests = requests.map((request) => {
      const encryptedFirstName = request.encrypted_first_name;
      const encryptedLastName = request.encrypted_last_name;

      let tenantFirstName = "";
      let tenantLastName = "";

      if (encryptedFirstName) {
        try {
          tenantFirstName = decryptData(
            JSON.parse(encryptedFirstName),
            process.env.ENCRYPTION_SECRET
          );
        } catch (err) {
          console.error("Error decrypting first name:", err);
          tenantFirstName = "Decryption Failed"; // Handle decryption failure
        }
      } else {
        tenantFirstName = "N/A"; // Or some other default value
      }

      if (encryptedLastName) {
        try {
          tenantLastName = decryptData(
            JSON.parse(encryptedLastName),
            process.env.ENCRYPTION_SECRET
          );
        } catch (err) {
          console.error("Error decrypting last name:", err);
          tenantLastName = "Decryption Failed"; // Handle decryption failure
        }
      } else {
        tenantLastName = "N/A"; // Or some other default value
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
