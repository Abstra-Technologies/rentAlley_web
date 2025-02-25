import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { propertyId, unitId, status, reason } = req.body;

    // Ensure status is valid
    if (!["approved", "disapproved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Ensure reason is provided when disapproving
    if (status === "disapproved" && (!reason || reason.trim() === "")) {
      return res
        .status(400)
        .json({ message: "Disapproval reason is required" });
    }

    // Update tenant application status
    const query = `
      UPDATE ProspectiveTenant 
      SET status = ?, disapproval_reason = ?, updated_at = NOW() 
      WHERE (property_id = ? OR unit_id = ?)
    `;

    const [result] = await db.query(query, [
      status,
      status === "disapproved" ? reason : null,
      propertyId || null,
      unitId || null,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res
      .status(200)
      .json({ message: `Tenant application ${status} successfully!` });
  } catch (error) {
    console.error("❌ Error updating tenant status:", error);
    res.status(500).json({ message: "Server Error" });
  }
}
