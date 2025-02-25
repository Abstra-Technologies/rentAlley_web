import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

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
        mr.category,
        mr.status,
        mr.created_at,
        mp.photo_url
      FROM MaintenanceRequest mr
      JOIN Tenant t ON mr.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      LEFT JOIN Property p ON mr.property_id = p.property_id
      LEFT JOIN Unit un ON mr.unit_id = un.unit_id
      LEFT JOIN MaintenancePhoto mp ON mr.request_id = mp.request_id
      WHERE p.landlord_id = ?;
    `;

    const [requests] = await db.query(query, [landlord_id]);

    // Decrypt maintenance photo link
    const decryptedRequests = requests.map((req) => {
      let photoUrl = "";

      if (req.photo_url) {
        try {
          const parsedPhoto = JSON.parse(req.photo_url); // Ensure it's parsed
          photoUrl = decryptData(parsedPhoto, process.env.ENCRYPTION_SECRET);
        } catch (error) {
          console.error("Error decrypting photo:", error);
        }
      }

      return {
        ...req,
        photo_url: photoUrl, // Add decrypted URL to response
      };
    });

    return res.status(200).json({ success: true, data: decryptedRequests });
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
