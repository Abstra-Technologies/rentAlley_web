import { db } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { property_id, unit_id, tenant_id, current_home_address } = req.body;

    if (!property_id || !tenant_id || !current_home_address) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Insert into ProspectiveTenant table (without government_id)
    const result = await db.query(
      "INSERT INTO ProspectiveTenant (property_id, unit_id, tenant_id, current_home_address, status) VALUES (?, ?, ?, ?, 'pending')",
      [property_id, unit_id || null, tenant_id, current_home_address]
    );

    const prospectiveTenantId = result.insertId;

    res.status(201).json({
      message: "Prospective Tenant info saved successfully!",
      prospectiveTenantId,
    });
  } catch (error) {
    console.error("❌ [Submit Info] Error:", error);
    res.status(500).json({ message: "Failed to save tenant info", error });
  }
}
