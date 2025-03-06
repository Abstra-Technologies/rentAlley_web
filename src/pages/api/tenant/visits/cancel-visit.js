import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { visit_id } = req.body;

    if (!visit_id) {
      return res.status(400).json({ message: "Visit ID is required" });
    }

    // Update visit status to 'cancelled'
    await db.query(
      `UPDATE PropertyVisit SET status = 'cancelled' WHERE visit_id = ?`,
      [visit_id]
    );

    res.status(200).json({ message: "Visit cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling visit:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
