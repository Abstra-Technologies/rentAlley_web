import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function getProperty(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Fetch the approved prospective tenant details
    const [prospectiveTenant] = await db.query(
      `SELECT unit_id FROM ProspectiveTenant 
             WHERE tenant_id = ? AND status = 'approved' 
             LIMIT 1`,
      [tenantId]
    );

    if (!prospectiveTenant || prospectiveTenant.length === 0) {
      return res.status(404).json({
        message: "No approved unit found for you",
      });
    }

    // Assign the first result from the array
    const unitId = prospectiveTenant[0].unit_id;

    // Fetch unit details and property name
    const [unitDetails] = await db.query(
      `SELECT 
          u.unit_id, u.unit_name, u.unit_size, u.bed_spacing, u.avail_beds, 
          u.rent_amount, u.furnish, u.status, 
          p.*
       FROM Unit u
       INNER JOIN Property p ON u.property_id = p.property_id
       WHERE u.unit_id = ?`,
      [unitId]
    );

    if (!unitDetails || unitDetails.length === 0) {
      return res.status(404).json({ message: "No unit details found" });
    }

    let unitData = unitDetails[0];

    // Fetch and decrypt all unit photos
    const [unitPhotos] = await db.query(
      `SELECT photo_url FROM UnitPhoto WHERE unit_id = ? ORDER BY id ASC`,
      [unitId]
    );

    if (unitPhotos.length > 0) {
      try {
        unitData.unit_photos = unitPhotos.map((photo) => {
          return decryptData(
            JSON.parse(photo.photo_url),
            process.env.ENCRYPTION_SECRET
          );
        });
      } catch (e) {
        console.error("Failed to decrypt unit photos:", e);
        unitData.unit_photos = [];
      }
    } else {
      unitData.unit_photos = [];
    }

    return res.status(200).json(unitDetails);
  } catch (error) {
    console.error("Error fetching property/unit info:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
