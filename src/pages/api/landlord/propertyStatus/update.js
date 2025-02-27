import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { propertyId, unitId, status } = req.body;

    if (!status || !["occupied", "unoccupied"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    let result;

    if (propertyId) {
      result = await db.query(
        "UPDATE Property SET status = ?, updated_at = NOW() WHERE property_id = ?",
        [status, propertyId]
      );
    } else if (unitId) {
      result = await db.query(
        "UPDATE Unit SET status = ?, updated_at = NOW() WHERE unit_id = ?",
        [status, unitId]
      );
    } else {
      return res
        .status(400)
        .json({ message: "Property ID or Unit ID is required" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Property or Unit not found" });
    }

    return res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
