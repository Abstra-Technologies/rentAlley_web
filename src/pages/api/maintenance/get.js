import { db } from "../../../../../pages/lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tenant_id, property_id, unit_id } = req.query;
    let query = `SELECT * FROM MaintenanceRequest WHERE 1=1`;
    let values = [];

    if (tenant_id) {
      query += ` AND tenant_id = ?`;
      values.push(tenant_id);
    }
    if (property_id) {
      query += ` AND property_id = ?`;
      values.push(property_id);
    }
    if (unit_id) {
      query += ` AND unit_id = ?`;
      values.push(unit_id);
    }

    const [requests] = await db.query(query, values);
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
