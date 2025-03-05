import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { landlord_id } = req.query;

    if (!landlord_id) {
      return res.status(400).json({ error: "Landlord ID is required" });
    }

    const query = `
      SELECT 
        mr.request_id,
        u.firstName AS tenant_first_name,
        u.lastName AS tenant_last_name,
        p.property_name,
        un.unit_name,
        mr.subject,
        mr.description,
        mr.category,
        mr.status,
        mr.created_at,
        COALESCE(GROUP_CONCAT(mp.photo_url SEPARATOR '||'), '[]') AS photo_urls
      FROM MaintenanceRequest mr
      JOIN Tenant t ON mr.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      JOIN Unit un ON mr.unit_id = un.unit_id
      JOIN Property p ON un.property_id = p.property_id
      LEFT JOIN MaintenancePhoto mp ON mr.request_id = mp.request_id
      WHERE p.landlord_id = ?
      GROUP BY mr.request_id, tenant_first_name, tenant_last_name, property_name, unit_name, subject, description, category, status, created_at;
    `;

    const [requests] = await db.query(query, [landlord_id]);

    // Decrypt maintenance photos and tenant names
    const decryptedRequests = requests.map((req) => {
      let decryptedPhotos = [];
      let decryptedFirstName = req.tenant_first_name;
      let decryptedLastName = req.tenant_last_name;

      // ✅ Properly handle photo_urls (Fix Grouped String Parsing)
      if (req.photo_urls && req.photo_urls !== "[]") {
        try {
          const parsedPhotos = req.photo_urls.split("||"); // Use || as separator
          decryptedPhotos = parsedPhotos.map((photo) =>
            decryptData(JSON.parse(photo), process.env.ENCRYPTION_SECRET)
          );
        } catch (error) {
          console.error("Error decrypting photos:", error);
        }
      }

      // Decrypt Tenant First & Last Name
      try {
        decryptedFirstName = decryptData(
          JSON.parse(req.tenant_first_name),
          process.env.ENCRYPTION_SECRET
        );
        decryptedLastName = decryptData(
          JSON.parse(req.tenant_last_name),
          process.env.ENCRYPTION_SECRET
        );
      } catch (error) {
        console.error("Error decrypting tenant details:", error);
      }

      return {
        ...req,
        tenant_first_name: decryptedFirstName,
        tenant_last_name: decryptedLastName,
        photo_urls: decryptedPhotos, // Array of decrypted photo URLs
      };
    });

    return res.status(200).json({ success: true, data: decryptedRequests });
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
