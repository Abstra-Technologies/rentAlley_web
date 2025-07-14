import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { tenant_id, address, occupation, employment_type, monthly_income } =
      req.body;

    if (
      !tenant_id ||
      !address ||
      !occupation ||
      !employment_type ||
      !monthly_income
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Update the Tenant table with the provided information
    const result = await db.query(
      "UPDATE Tenant SET address = ?, occupation = ?, employment_type = ?, monthly_income = ?, updatedAt = NOW() WHERE tenant_id = ?",
      [address, occupation, employment_type, monthly_income, tenant_id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Tenant not found or no changes made." });
    }

    res.status(200).json({ message: "Tenant info updated successfully!" });
  } catch (error) {
    console.error("❌ [Submit Info] Error:", error);
    res.status(500).json({ message: "Failed to save tenant info", error });
  }
}
