import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { visit_id, status, reason } = req.body;

  // Validate request body
  if (!visit_id) {
    return res.status(400).json({ message: "Missing visit_id." });
  }

  // Expanded list of valid statuses
  const validStatuses = ["approved", "disapproved", "cancelled", "pending"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  // Reason is required for disapproval
  if (status === "disapproved" && !reason) {
    return res.status(400).json({ message: "Disapproval reason is required." });
  }

  try {
    let result;
    
    // Different update logic based on status
    switch(status) {
      case "disapproved":
        [result] = await db.query(
          `UPDATE PropertyVisit 
           SET status = ?, 
               disapproval_reason = ?, 
               updated_at = NOW() 
           WHERE visit_id = ?`,
          [status, reason, visit_id]
        );
        break;
      
      case "cancelled":
        [result] = await db.query(
          `UPDATE PropertyVisit 
           SET status = ?, 
               updated_at = NOW() 
           WHERE visit_id = ?`,
          [status, visit_id]
        );
        break;
      
      default:
        [result] = await db.query(
          `UPDATE PropertyVisit 
           SET status = ?, 
               disapproval_reason = NULL, 
               updated_at = NOW() 
           WHERE visit_id = ?`,
          [status, visit_id]
        );
    }

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Visit not found or already updated." });
    }

    res.status(200).json({ 
      message: `Visit ${status === 'cancelled' ? 'cancelled' : status} successfully.`,
      updatedStatus: status 
    });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ message: "Server error." });
  }
}