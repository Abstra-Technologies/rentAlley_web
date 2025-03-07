import { db } from "../../../lib/db";
import { Server } from "socket.io";

export default async function CreateNewMaintenanceRequest(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tenant_id, subject, description, category } = req.body;

    console.log("Request Data:", req.body);

    const [tenantRecord] = await db.query(
      "SELECT unit_id FROM LeaseAgreement WHERE tenant_id = ? AND status = 'active'",
      [tenant_id]
    );

    if (!tenantRecord.length) {
      return res.status(404).json({ error: "No approved rental found" });
    }

    const { unit_id } = tenantRecord[0];

    const [result] = await db.query(
      `INSERT INTO MaintenanceRequest
            (tenant_id, unit_id, subject, description, category, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [tenant_id, unit_id, subject, description, category, "Pending"]
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

