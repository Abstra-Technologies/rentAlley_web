import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { tenant_id } = req.query;

    if (!tenant_id) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Fetch visits for the tenant
    const [visits] = await db.query(
      `SELECT pv.visit_id, p.property_name, u.unit_name, pv.visit_date, pv.visit_time, pv.status, pv.disapproval_reason
         FROM PropertyVisit pv
         JOIN Unit u ON pv.unit_id = u.unit_id
         JOIN Property p ON u.property_id = p.property_id
         WHERE pv.tenant_id = ? ORDER BY pv.visit_date DESC`,
      [tenant_id]
    );

    res.status(200).json(visits);
  } catch (error) {
    console.error("Error fetching visits:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
