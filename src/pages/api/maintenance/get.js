import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function tenantAllMaintenanceRequest(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  const { tenantId } = req.query;

  if (!tenantId)
    return res.status(400).json({ message: "Tenant ID is required" });

  try {
    const [approvedTenant] = await db.query(
      `SELECT * FROM ProspectiveTenant 
       WHERE tenant_id = ? AND status = 'approved'`,
      [tenantId]
    );

    if (approvedTenant.length === 0) {
      return res
        .status(403)
        .json({ message: "Access denied. Tenant not approved." });
    }

    // Fetch maintenance requests with the allowed statuses
    const [maintenanceRequests] = await db.query(
      `SELECT m.*, u.unit_name, p.property_name
       FROM MaintenanceRequest m
       LEFT JOIN Unit u ON m.unit_id = u.unit_id
       LEFT JOIN Property p ON u.property_id = p.property_id
       WHERE m.tenant_id = ? 
       AND m.status IN ('Pending', 'Scheduled', 'In-Progress')`,
      [tenantId]
    );

    if (maintenanceRequests.length === 0) {
      return res.status(200).json([]);
    }

    for (const request of maintenanceRequests) {
      const [photos] = await db.query(
        `SELECT photo_url FROM MaintenancePhoto WHERE request_id = ?`,
        [request.request_id]
      );

      request.photos =
        photos.length > 0
          ? photos
              .map((photo) => {
                try {
                  const parsedUrl = JSON.parse(photo.photo_url);
                  return decryptData(parsedUrl, process.env.ENCRYPTION_SECRET);
                } catch (error) {
                  console.error(
                    "Error parsing or decrypting photo URL:",
                    error
                  );
                  return null;
                }
              })
              .filter(Boolean) // Remove null values
          : [];
    }
    res.status(200).json(maintenanceRequests);
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
