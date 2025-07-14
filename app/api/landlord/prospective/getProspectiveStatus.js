import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { unit_id, tenant_id } = req.query;

    if (!unit_id) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const query = `
      SELECT status 
      FROM ProspectiveTenant 
      WHERE unit_id = ? AND tenant_id = ?
      ORDER BY updated_at DESC
    `;

    const [rows] = await db.query(query, [unit_id, tenant_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No prospective tenant found" });
    }

    return res.status(200).json({ status: rows[0].status });
  } catch (error) {
    console.error("Error fetching prospective tenant status:", error);
  }
}
