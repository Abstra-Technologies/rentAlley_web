import { db } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tenant_id, property_id, unit_id, subject, description, category } =
      req.body;

    // Ensure at least property_id or unit_id is provided
    if (
      !tenant_id ||
      (!property_id && !unit_id) ||
      !subject ||
      !description ||
      !category
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert into the database
    const [result] = await db.query(
      `INSERT INTO MaintenanceRequest 
            (tenant_id, property_id, unit_id, subject, description, category, status) 
            VALUES (?, ?, ?, ?, ?, ?, "Pending")`,
      [
        tenant_id,
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
