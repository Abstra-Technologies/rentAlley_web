import { db } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { tenant_id, property_id, unit_id, visit_date, visit_time } = req.body;

  try {
    // Check if the chosen visit date is already booked
    // const existingVisit = await db.query(
    //   "SELECT * FROM PropertyVisit WHERE (property_id = ? OR unit_id = ?) AND visit_date = ? AND visit_time = ? AND status = 'approved'",
    //   [
    //     property_id || null,
    //     unit_id !== null ? unit_id : null,
    //     visit_date,
    //     visit_time,
    //   ]
    // );

    // console.log("Existing Visit:", existingVisit); // Add this log

    // if (existingVisit.length > 0) {
    //   return res
    //     .status(400)
    //     .json({ message: "The chosen date and time is already booked." });
    // }

    // Schedule the visit
    await db.query(
      "INSERT INTO PropertyVisit (tenant_id, property_id, unit_id, visit_date, visit_time) VALUES (?, ?, ?, ?, ?)",
      [
        tenant_id,
        property_id || null,
        unit_id !== null ? unit_id : null,
        visit_date,
        visit_time,
      ]
    );

    return res.status(200).json({ message: "Visit scheduled successfully." });
  } catch (error) {
    console.error("Error scheduling visit:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}
