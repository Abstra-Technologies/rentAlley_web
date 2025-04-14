import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { unitId } = req.query;

    const [rows] = await db.query("SELECT status FROM Unit WHERE unit_id = ?", [
      unitId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const unitStatus = rows[0].status;

    return res.status(200).json({ status: unitStatus });
  } catch (error) {
    console.error("Error fetching status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
