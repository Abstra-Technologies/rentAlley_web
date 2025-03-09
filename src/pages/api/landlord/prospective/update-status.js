import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { unitId, status, message, tenant_id } = req.body;

    console.log("Received Payload:", req.body);

    // Ensure status is valid
    if (!["pending", "approved", "disapproved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Ensure message is provided when disapproving
    if (status === "disapproved" && (!message || message.trim() === "")) {
      return res
        .status(400)
        .json({ message: "Disapproval message is required" });
    }

    // Update tenant application status
    const query = `
      UPDATE ProspectiveTenant 
      SET status = ?, message = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE unit_id = ? AND tenant_id = ?
    `;

    const [result] = await db.query(query, [status, message || null, unitId, tenant_id]);

     // If approved, create lease agreement
     if (status === "approved") {
      const leaseQuery = `
        INSERT INTO LeaseAgreement (tenant_id, unit_id, start_date, end_date, status)
        VALUES (?, ?, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), 'active')
      `;

      await db.query(leaseQuery, [tenant_id, unitId]);
    }

    res.status(200).json({ message: `Tenant application ${status} successfully!` });
  } catch (error) {
    console.error("Error updating tenant status:", error);
    res.status(500).json({ message: "Server Error" });
  }
}

    

