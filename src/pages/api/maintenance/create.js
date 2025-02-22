import { db } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tenant_id, subject, description, category } = req.body;

    console.log("Request Data:", req.body);

    // Fetch property_id and unit_id from ProspectiveTenant table
    const [tenantRecord] = await db.query(
      "SELECT property_id, unit_id FROM ProspectiveTenant WHERE tenant_id = ? AND status = 'approved' LIMIT 1",
      [tenant_id]
    );

    if (!tenantRecord.length) {
      return res.status(404).json({ error: "No approved rental found" });
    }

    const { property_id, unit_id } = tenantRecord[0];

    // Fetch landlord_id from Property table
    const [propertyRecord] = await db.query(
      "SELECT landlord_id FROM Property WHERE property_id = ? LIMIT 1",
      [property_id]
    );

    const { landlord_id } = propertyRecord[0];

    // Insert into the database
    const [result] = await db.query(
      `INSERT INTO MaintenanceRequest 
            (tenant_id, landlord_id, property_id, unit_id, subject, description, category, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, "Pending")`,
      [
        tenant_id,
        landlord_id,
        property_id || null,
        unit_id || null,
        subject,
        description,
        category,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Maintenance request created successfully",
      request_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
