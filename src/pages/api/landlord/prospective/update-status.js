import { db } from "../../../../lib/db";
export default async function updateProspectStatus(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { unitId, status, message, tenant_id } = req.body;

    console.log("Received Payload:", req.body);

    if (!["pending", "approved", "disapproved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (status === "disapproved" && (!message || message.trim() === "")) {
      return res
          .status(400)
          .json({ message: "Disapproval message is required" });
    }

    const tenantQuery = `SELECT user_id FROM Tenants WHERE tenant_id = ?`;
    const [tenantResult] = await db.query(tenantQuery, [tenant_id]);

    if (!tenantResult || tenantResult.length === 0) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const user_id = tenantResult.user_id;

    const updateQuery = `
      UPDATE ProspectiveTenant 
      SET status = ?, message = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE unit_id = ? AND tenant_id = ?
    `;

    await db.query(updateQuery, [status, message || null, unitId, tenant_id]);

    if (status === "approved") {
      const leaseQuery = `
        INSERT INTO LeaseAgreement (tenant_id, unit_id, start_date, end_date, status)
        VALUES (?, ?, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR), 'active')
      `;

      await db.query(leaseQuery, [tenant_id, unitId]);
    }

    const notificationQuery = `
      INSERT INTO Notification (user_id, title, body, is_read, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const notificationMessage =
        status === "approved"
            ? "Your tenant application has been approved! Check your lease agreement."
            : `Your tenant application was disapproved. Reason: ${message}`;

    await db.query(notificationQuery, [
      user_id,
      "Tenant Application Update",
      notificationMessage,
      0,
    ]);

    res.status(200).json({
      message: `Tenant application ${status} successfully!`,
    });
  } catch (error) {
    console.error("Error updating tenant status:", error);
    res.status(500).json({ message: "Server Error" });
  }
}
