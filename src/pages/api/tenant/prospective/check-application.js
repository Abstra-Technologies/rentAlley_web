import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { tenant_id, unit_id } = req.query;

  if (!tenant_id || !unit_id) {
    return res.status(400).json({ message: "Missing tenant_id or unit_id" });
  }

  try {
    const result = await db.query(
      "SELECT id FROM ProspectiveTenant WHERE tenant_id = ? AND unit_id = ?",
      [tenant_id, unit_id]
    );

    if (result.length > 0) {
      return res.status(200).json({ hasApplied: true });
    }

    return res.status(200).json({ hasApplied: false });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
