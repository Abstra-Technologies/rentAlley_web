import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).json({ message: "Method Not Allowed" });

  const { visit_id, reason, status } = req.body;

  if (!["approved", "disapproved"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  try {
    // Update the PropertyVisit table based on the status
    if (status === "disapproved") {
      // Update the visit with both status and reason
      await db.query(
        "UPDATE PropertyVisit SET status = ?, disapproval_reason = ? WHERE visit_id = ?",
        [status, reason, visit_id]
      );
    } else {
      // Update the visit with just the status if it's approved
      await db.query("UPDATE PropertyVisit SET status = ? WHERE visit_id = ?", [
        status,
        visit_id,
      ]);
    }
    res.status(200).json({ message: `Visit ${status}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
}
