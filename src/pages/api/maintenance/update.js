import { db } from "../../../../../pages/lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { request_id, status, schedule_date, completion_date } = req.body;

    if (!request_id || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let query = `UPDATE MaintenanceRequest SET status = ?, updated_at = NOW()`;
    let values = [status];

    if (schedule_date) {
      query += `, schedule_date = ?`;
      values.push(schedule_date);
    }

    if (completion_date) {
      query += `, completion_date = ?`;
      values.push(completion_date);
    }

    query += ` WHERE request_id = ?`;
    values.push(request_id);

    await db.query(query, values);

    return res.status(200).json({
      success: true,
      message: "Maintenance request updated successfully",
    });
  } catch (error) {
    console.error("Error updating maintenance request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
