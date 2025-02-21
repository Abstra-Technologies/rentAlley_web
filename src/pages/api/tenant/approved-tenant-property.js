import { db } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { tenantId } = req.query; // Get tenant ID from query params

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Fetch the approved prospective tenant details
    const [prospectiveTenant] = await db.query(
      `SELECT property_id, unit_id FROM ProspectiveTenant 
             WHERE tenant_id = ? AND status = 'approved' 
             LIMIT 1`,
      [tenantId]
    );

    if (!prospectiveTenant) {
      return res.status(404).json({
        message: "No approved property or unit found for this tenant",
      });
    }

    let result;

    // If the tenant is assigned a property (but no unit)
    if (prospectiveTenant.property_id && !prospectiveTenant.unit_id) {
      [result] = await db.query(
        `SELECT 
            p.property_id, p.property_name, p.property_type, p.amenities, 
            p.street, p.city, p.zip_code, p.province, p.description, 
            (SELECT pp.photo_url FROM PropertyPhoto pp 
             WHERE pp.property_id = p.property_id 
             ORDER BY pp.photo_id ASC LIMIT 1) AS property_photo
        FROM Property p
        WHERE p.property_id = ?`,
        [prospectiveTenant.property_id]
      );
    }

    // If the tenant is assigned to a specific unit
    else if (prospectiveTenant.unit_id) {
      [result] = await db.query(
        `SELECT 
            u.unit_id, u.unit_name, u.description, u.floor_area, 
            u.rent_payment, u.furnish, u.status, 
            p.property_id, p.property_name, p.city, p.street,
            (SELECT up.photo_url FROM UnitPhoto up 
             WHERE up.unit_id = u.unit_id 
             ORDER BY up.id ASC LIMIT 1) AS unit_photo
        FROM Unit u
        INNER JOIN Property p ON u.property_id = p.property_id
        WHERE u.unit_id = ?`,
        [prospectiveTenant.unit_id]
      );
    }

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ message: "No property or unit details found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching property/unit info:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
