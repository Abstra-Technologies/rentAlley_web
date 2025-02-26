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

  if (!["approved", "disapproved"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  if (status === "disapproved" && !reason) {
    return res.status(400).json({ message: "Disapproval reason is required." });
  }

  try {
    // Debugging: Log received data
    console.log("Updating Visit ID:", visit_id, "Status:", status, "Reason:", reason);

    let result;

    if (status === "disapproved") {
      [result] = await db.query(
        `UPDATE PropertyVisit
          SET status = ?, disapproval_reason = ?, updated_at = NOW()
          WHERE visit_id = ?`,
        [status, reason, visit_id]
      );
    } else {
      [result] = await db.query(
        `UPDATE PropertyVisit
          SET status = ?, disapproval_reason = NULL, updated_at = NOW()
          WHERE visit_id = ?`,
        [status, visit_id]
      );
    }

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Visit not found or already updated." });
    }

    res.status(200).json({ message: `Visit ${status} successfully.` });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ message: "Server error." });
  }
}