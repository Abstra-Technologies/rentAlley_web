import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { tenant_id, unit_id, visit_date, visit_time } = req.body;

  try {
    // Schedule the visit
    await db.query(
      "INSERT INTO PropertyVisit (tenant_id, unit_id, visit_date, visit_time) VALUES (?, ?, ?, ?)",
      [tenant_id, unit_id, visit_date, visit_time]
    );

    return res.status(200).json({ message: "Visit scheduled successfully." });
  } catch (error) {
    console.error("Error scheduling visit:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}
