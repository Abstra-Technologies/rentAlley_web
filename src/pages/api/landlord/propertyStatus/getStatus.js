import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { propertyId, unitId } = req.query;

    let result;
    if (propertyId) {
      result = await db.query(
        "SELECT status FROM Property WHERE property_id = ?",
        [propertyId]
      );
    } else if (unitId) {
      result = await db.query("SELECT status FROM Unit WHERE unit_id = ?", [
        unitId,
      ]);
    } else {
      return res
        .status(400)
        .json({ message: "Property ID or Unit ID is required" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Property or Unit not found" });
    }

    return res.status(200).json({ status: result[0].status });
  } catch (error) {
    console.error("Error fetching status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
