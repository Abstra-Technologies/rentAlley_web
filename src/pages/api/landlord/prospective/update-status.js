import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  
  try {
    const { id, status, message } = req.body;
    
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
      WHERE id = ?
    `;
    
    const [result] = await db.query(query, [
      status,
      message || null,
      id
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